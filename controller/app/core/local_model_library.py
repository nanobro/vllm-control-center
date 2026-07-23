from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from app.db import dumps_json, execute, fetchall, fetchone, loads_json
from app.schemas.local_models import LocalModelRecord, LocalModelScanRoot, LocalModelVariantGroup
from app.schemas.instances import VllmServeConfig


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


USER_SCAN_ROOTS_KEY = 'local_model_scan_roots'


def _split_model_dirs(raw: str) -> list[str]:
    paths: list[str] = []
    for item in re.split(r'[;:]', raw):
        item = item.strip()
        if item:
            paths.append(item)
    return paths


def _dedupe_paths(paths: list[Path]) -> list[Path]:
    dedup: list[Path] = []
    seen: set[str] = set()
    for path in paths:
        expanded = path.expanduser()
        key = str(expanded)
        if key not in seen:
            dedup.append(expanded)
            seen.add(key)
    return dedup


async def get_user_scan_roots() -> list[str]:
    row = await fetchone('SELECT value_json FROM settings WHERE key = ?', (USER_SCAN_ROOTS_KEY,))
    if not row:
        return []
    try:
        value = loads_json(row['value_json'])
    except Exception:
        return []
    if not isinstance(value, list):
        return []
    return [str(item) for item in value if isinstance(item, str) and item.strip()]


async def set_user_scan_roots(paths: list[str]) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()
    for raw in paths:
        path = str(raw).strip()
        if not path:
            continue
        normalized = str(Path(path).expanduser())
        if normalized not in seen:
            cleaned.append(normalized)
            seen.add(normalized)
    ts = now_iso()
    await execute(
        'INSERT INTO settings(key, value_json, updated_at) VALUES (?, ?, ?) '
        'ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at',
        (USER_SCAN_ROOTS_KEY, dumps_json(cleaned), ts),
    )
    return cleaned


async def add_user_scan_root(path: str) -> list[str]:
    cleaned = str(Path(path.strip()).expanduser()) if path.strip() else ''
    if not cleaned:
        raise ValueError('Scan path cannot be empty.')
    current = await get_user_scan_roots()
    return await set_user_scan_roots(current + [cleaned])


async def remove_user_scan_root(path: str) -> list[str]:
    target = str(Path(path.strip()).expanduser())
    current = await get_user_scan_roots()
    return await set_user_scan_roots([item for item in current if str(Path(item).expanduser()) != target])


def _safe_id(value: str) -> str:
    return value.replace('/', '--').replace('\\', '--').replace(' ', '-').lower()


def format_size(size_bytes: int | None) -> str | None:
    if size_bytes is None:
        return None
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    value = float(size_bytes)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f'{value:.1f} {unit}' if unit != 'B' else f'{int(value)} B'
        value /= 1024
    return None


def dir_size(path: Path, limit_files: int = 20000) -> int | None:
    if not path.exists():
        return None
    if path.is_file():
        try:
            return path.stat().st_size
        except OSError:
            return None
    total = 0
    seen = 0
    try:
        for file in path.rglob('*'):
            if not file.is_file():
                continue
            seen += 1
            if seen > limit_files:
                return total
            try:
                total += file.stat().st_size
            except OSError:
                continue
    except OSError:
        return None
    return total


def _path_mtime(path: Path) -> str | None:
    try:
        ts = path.stat().st_mtime
    except OSError:
        return None
    return datetime.fromtimestamp(ts, timezone.utc).isoformat()


def _default_scan_roots() -> list[tuple[Path, str]]:
    roots: list[tuple[Path, str]] = []
    home = Path.home()
    cwd = Path.cwd()

    if os.environ.get('HF_HOME'):
        roots.append((Path(os.environ['HF_HOME']) / 'hub', 'HF_HOME'))
    if os.environ.get('HUGGINGFACE_HUB_CACHE'):
        roots.append((Path(os.environ['HUGGINGFACE_HUB_CACHE']), 'HUGGINGFACE_HUB_CACHE'))

    # Hugging Face / vLLM defaults
    roots.append((home / '.cache' / 'huggingface' / 'hub', 'huggingface-cache'))
    roots.append((home / '.cache' / 'vllm', 'vllm-cache'))

    # LM Studio stores downloaded models here on most Linux/macOS installs.
    # Keep several harmless candidates so users coming from LM Studio see their
    # existing library without knowing the path up front.
    roots.append((home / '.lmstudio' / 'models', 'lm-studio'))
    roots.append((home / '.cache' / 'lm-studio' / 'models', 'lm-studio-cache'))
    roots.append((home / 'Library' / 'Application Support' / 'LM Studio' / 'models', 'lm-studio-macos'))

    # Unsloth and common local download folders.
    roots.append((home / '.cache' / 'unsloth', 'unsloth-cache'))
    roots.append((home / 'unsloth', 'unsloth'))
    roots.append((home / 'models', 'home-models'))
    roots.append((home / 'Downloads', 'downloads'))
    roots.append((cwd / 'models', 'project-models'))
    roots.append((cwd / 'controller' / 'models', 'controller-models'))

    for env_name in ('VCC_MODEL_DIRS', 'VCC_EXTRA_MODEL_DIRS', 'VLLM_MODEL_DIRS', 'UNSLOTH_MODEL_DIRS', 'LMSTUDIO_MODEL_DIRS'):
        for item in _split_model_dirs(os.environ.get(env_name, '')):
            roots.append((Path(item), env_name))
    return roots


def _scan_roots_with_sources(user_roots: list[str] | None = None) -> list[tuple[Path, str]]:
    roots = _default_scan_roots()
    for item in user_roots or []:
        roots.append((Path(item), 'app-scan-path'))
    dedup: list[tuple[Path, str]] = []
    seen: set[str] = set()
    for path, source in roots:
        expanded = path.expanduser()
        key = str(expanded)
        if key not in seen:
            dedup.append((expanded, source))
            seen.add(key)
    return dedup


def _hf_cache_roots(user_roots: list[str] | None = None) -> list[Path]:
    return [path for path, _source in _scan_roots_with_sources(user_roots)]

def _model_id_from_hf_cache_dir(path: Path) -> str | None:
    name = path.name
    if not name.startswith('models--'):
        return None
    parts = name.split('--')
    if len(parts) < 3:
        return None
    return '/'.join(parts[1:])


def _best_hf_snapshot_path(model_cache_dir: Path) -> Path:
    snapshots = model_cache_dir / 'snapshots'
    if not snapshots.exists():
        return model_cache_dir
    candidates = [p for p in snapshots.iterdir() if p.is_dir()]
    if not candidates:
        return model_cache_dir
    return max(candidates, key=lambda p: p.stat().st_mtime)



def _infer_parameter_count_b(value: str) -> float | None:
    match = re.search(r'(\d+(?:\.\d+)?)(?:\s|-)?([bm])\b', value, flags=re.IGNORECASE)
    if not match:
        return None
    number = float(match.group(1))
    suffix = match.group(2).lower()
    return number if suffix == 'b' else number / 1000


def _infer_quantization_from_name(value: str) -> str | None:
    normalized = value.upper().replace('-', '_')
    patterns = [
        r'Q\d(?:_K)?_[A-Z0-9]+',
        r'Q\d_\d',
        r'Q\d',
        r'IQ\d_[A-Z0-9]+',
        r'F16',
        r'BF16',
        r'FP16',
        r'FP8',
        r'AWQ',
        r'GPTQ',
    ]
    for pattern in patterns:
        match = re.search(pattern, normalized)
        if match:
            return match.group(0).replace('_', '-')
    return None


def _normalize_quantization(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    normalized = text.upper().replace('_', '-').replace(' ', '-')
    aliases = {
        'BITSANDBYTES': 'bitsandbytes',
        'BNB': 'bitsandbytes',
        'AWQ': 'AWQ',
        'GPTQ': 'GPTQ',
        'FP8': 'FP8',
        'F16': 'FP16',
        'FLOAT16': 'FP16',
        'FP16': 'FP16',
        'BFLOAT16': 'BF16',
        'BF16': 'BF16',
    }
    return aliases.get(normalized, normalized)


def _infer_quantization_from_config(config: dict | None) -> str | None:
    if not config:
        return None
    quant_config = config.get('quantization_config')
    if isinstance(quant_config, dict):
        for key in ('quant_method', 'bits', 'load_in_4bit', 'load_in_8bit'):
            value = quant_config.get(key)
            if key == 'bits' and isinstance(value, int):
                method = _normalize_quantization(quant_config.get('quant_method'))
                return f'{method or "INT"}{value}'
            if value is True and key == 'load_in_4bit':
                return 'bitsandbytes-4bit'
            if value is True and key == 'load_in_8bit':
                return 'bitsandbytes-8bit'
            normalized = _normalize_quantization(value)
            if normalized:
                return normalized
    for key in ('quantization', 'quant_method'):
        normalized = _normalize_quantization(config.get(key))
        if normalized:
            return normalized
    return None


def _dtype_from_config(config: dict | None) -> str | None:
    if not config:
        return None
    for key in ('torch_dtype', 'dtype', 'params_dtype'):
        value = config.get(key)
        if isinstance(value, str) and value.strip():
            cleaned = value.replace('torch.', '').lower()
            if cleaned in {'float16', 'fp16'}:
                return 'FP16'
            if cleaned in {'bfloat16', 'bf16'}:
                return 'BF16'
            if cleaned in {'float32', 'fp32'}:
                return 'FP32'
            return cleaned.upper()
    return None


def _tokenizer_present(path: Path, files: list[Path]) -> bool | None:
    if path.is_file():
        return None
    names = {item.name for item in files if item.parent == path or path in item.parents}
    if any(name in names for name in ('tokenizer.json', 'tokenizer.model', 'tokenizer_config.json')):
        return True
    if {'vocab.json', 'merges.txt'}.issubset(names):
        return True
    return False


def _context_length_from_config(config: dict | None) -> int | None:
    if not config:
        return None
    for key in (
        'max_position_embeddings',
        'seq_length',
        'n_positions',
        'model_max_length',
        'max_sequence_length',
        'sliding_window',
    ):
        value = config.get(key)
        if isinstance(value, int) and value > 0:
            return value
    rope_scaling = config.get('rope_scaling')
    if isinstance(rope_scaling, dict):
        original = rope_scaling.get('original_max_position_embeddings')
        factor = rope_scaling.get('factor')
        if isinstance(original, int) and isinstance(factor, (int, float)) and factor > 1:
            return int(original * factor)
    return None


def _compatibility_summary(metadata: dict, *, has_config: bool, has_tokenizer: bool | None, files: list[Path]) -> tuple[str, str, list[str], str | None, list[str]]:
    """Return a small, user-facing vLLM compatibility summary.

    This is deliberately conservative. It does not promise that a model will load;
    it tells the UI whether the local files look like a normal vLLM target and what
    to check next.
    """
    fmt = metadata.get('format')
    quant = (metadata.get('quantization') or '').upper()
    reasons: list[str] = []
    warnings: list[str] = []
    suggested = None

    if fmt == 'GGUF':
        suggested = 'GGUF file path'
        reasons.append('Single GGUF variant detected.')
        if not metadata.get('architecture'):
            reasons.append('Architecture is stored inside GGUF and is not parsed by the lightweight scanner.')
        return 'limited', 'GGUF: load with care', reasons, suggested, warnings

    if fmt in {'Safetensors', 'PyTorch bin', 'HF snapshot'}:
        suggested = 'Hugging Face snapshot path'
        if has_config:
            reasons.append('config.json found.')
        else:
            warnings.append('Missing config.json; vLLM may not know how to load this folder.')
        if has_tokenizer is True:
            reasons.append('Tokenizer files found.')
        elif has_tokenizer is False:
            warnings.append('No tokenizer files found in this snapshot.')
        if metadata.get('is_multi_file'):
            reasons.append(f"{metadata.get('weight_file_count')} weight shards detected.")
        if quant in {'AWQ', 'GPTQ'} or quant.startswith('AWQ') or quant.startswith('GPTQ'):
            reasons.append(f'{metadata.get("quantization")} quantization detected.')
        elif quant.startswith('BITSANDBYTES'):
            warnings.append('bitsandbytes-style quantization may need extra packages and exact vLLM support.')
        elif metadata.get('dtype_hint'):
            reasons.append(f'{metadata.get("dtype_hint")} dtype hint detected.')
        if has_config and files:
            return ('ready', 'vLLM-ready files', reasons, suggested, warnings) if not warnings else ('likely', 'Likely vLLM-ready', reasons, suggested, warnings)
        return 'attention', 'Needs model files', reasons, suggested, warnings

    if not files:
        warnings.append('No weight files found in this folder.')
    return 'attention', 'Needs check', reasons, suggested, warnings


def _read_json_file(path: Path) -> dict | None:
    try:
        with path.open('r', encoding='utf-8') as handle:
            data = json.load(handle)
    except (OSError, json.JSONDecodeError, UnicodeDecodeError):
        return None
    return data if isinstance(data, dict) else None


def _missing_indexed_weight_files(path: Path) -> list[str]:
    """Return weight shards referenced by an HF index but absent from the snapshot."""
    if not path.is_dir():
        return []
    expected: set[str] = set()
    for name in ('model.safetensors.index.json', 'pytorch_model.bin.index.json'):
        index = _read_json_file(path / name)
        weight_map = index.get('weight_map') if index else None
        if isinstance(weight_map, dict):
            expected.update(str(value) for value in weight_map.values() if isinstance(value, str))
    return sorted(name for name in expected if not (path / name).is_file())


def _detect_local_metadata(path: Path | None, model_id: str) -> dict:
    metadata: dict = {
        'format': None,
        'quantization': None,
        'architecture': None,
        'context_length': None,
        'parameter_count_b': _infer_parameter_count_b(model_id),
        'variant_count': None,
        'file_count': None,
        'weight_file_count': None,
        'is_multi_file': False,
        'config_present': False,
        'tokenizer_present': None,
        'dtype_hint': None,
        'compatibility_status': 'unknown',
        'compatibility_label': None,
        'compatibility_reasons': [],
        'suggested_load_format': None,
        'metadata_warnings': [],
    }
    if path is None or not path.exists():
        if path is not None:
            metadata['metadata_warnings'].append('local path does not exist')
            metadata['compatibility_status'] = 'attention'
            metadata['compatibility_label'] = 'Path missing'
        return metadata

    files: list[Path] = []
    if path.is_file():
        files = [path]
    else:
        try:
            files = [item for item in path.rglob('*') if item.is_file()]
        except OSError as exc:
            metadata['metadata_warnings'].append(f'could not scan local metadata: {exc}')
            metadata['compatibility_status'] = 'attention'
            metadata['compatibility_label'] = 'Scan failed'
            return metadata

    gguf_files = [item for item in files if item.suffix.lower() == '.gguf']
    safetensors_files = [item for item in files if item.suffix.lower() == '.safetensors']
    bin_files = [item for item in files if item.suffix.lower() == '.bin']
    weight_files = gguf_files or safetensors_files or bin_files
    metadata['file_count'] = len(files)
    metadata['weight_file_count'] = len(weight_files) or None
    metadata['variant_count'] = len(gguf_files) or len(safetensors_files) or len(bin_files) or None
    metadata['is_multi_file'] = len(weight_files) > 1

    config_path = path / 'config.json' if path.is_dir() else path.parent / 'config.json'
    config = _read_json_file(config_path) if config_path.exists() else None
    metadata['config_present'] = bool(config)
    metadata['tokenizer_present'] = _tokenizer_present(path if path.is_dir() else path.parent, files)
    missing_weight_files = _missing_indexed_weight_files(path if path.is_dir() else path.parent)

    if config:
        architectures = config.get('architectures')
        if isinstance(architectures, list) and architectures:
            metadata['architecture'] = str(architectures[0])
        elif config.get('model_type'):
            metadata['architecture'] = str(config['model_type'])
        metadata['context_length'] = _context_length_from_config(config)
        metadata['dtype_hint'] = _dtype_from_config(config)
        if metadata['parameter_count_b'] is None:
            metadata['parameter_count_b'] = _infer_parameter_count_b(path.name)
        metadata['quantization'] = _infer_quantization_from_config(config)

    if gguf_files:
        metadata['format'] = 'GGUF'
        # Prefer the largest GGUF as the likely primary local variant.
        primary = max(gguf_files, key=lambda item: item.stat().st_size if item.exists() else 0)
        metadata['quantization'] = metadata.get('quantization') or _infer_quantization_from_name(primary.name)
        if metadata['parameter_count_b'] is None:
            metadata['parameter_count_b'] = _infer_parameter_count_b(primary.name)
    elif safetensors_files:
        metadata['format'] = 'Safetensors'
    elif bin_files:
        metadata['format'] = 'PyTorch bin'
    elif config:
        metadata['format'] = 'HF snapshot'

    if metadata['quantization'] is None:
        metadata['quantization'] = (
            _infer_quantization_from_name(model_id)
            or _infer_quantization_from_name(path.name)
            or _normalize_quantization(metadata.get('dtype_hint'))
        )

    status, label, reasons, suggested, warnings = _compatibility_summary(
        metadata,
        has_config=bool(config),
        has_tokenizer=metadata['tokenizer_present'],
        files=weight_files,
    )
    metadata['compatibility_status'] = status
    metadata['compatibility_label'] = label
    metadata['compatibility_reasons'] = reasons
    metadata['suggested_load_format'] = suggested
    metadata['metadata_warnings'].extend(warnings)
    if missing_weight_files:
        metadata['compatibility_status'] = 'attention'
        metadata['compatibility_label'] = 'Incomplete checkpoint'
        metadata['metadata_warnings'].append(
            f"Checkpoint index references {len(missing_weight_files)} missing weight shard(s): "
            + ', '.join(missing_weight_files[:5])
        )
    return metadata

def _looks_like_model_dir(path: Path) -> bool:
    if not path.is_dir():
        return False
    direct_names = {'config.json', 'tokenizer_config.json', 'generation_config.json'}
    try:
        direct = list(path.iterdir())
    except OSError:
        return False
    if any(item.name in direct_names for item in direct):
        return True
    if any(item.suffix.lower() in {'.gguf', '.safetensors', '.bin'} for item in direct if item.is_file()):
        return True
    # HF snapshots can put actual files under snapshots/<revision>.
    snapshots = path / 'snapshots'
    if snapshots.exists() and snapshots.is_dir():
        try:
            for snap in snapshots.iterdir():
                if snap.is_dir() and _looks_like_model_dir(snap):
                    return True
        except OSError:
            return False
    return False


def _local_model_id_from_path(path: Path, root: Path) -> str:
    if path.parent.name == 'snapshots' and path.parent.parent.name.startswith('models--'):
        return path.parent.parent.name.removeprefix('models--').replace('--', '/')
    try:
        rel = path.relative_to(root)
    except ValueError:
        rel = Path(path.name)
    if path.is_file():
        rel = rel.with_suffix('')
    parts = [part for part in rel.parts if part not in {'snapshots'}]
    if len(parts) >= 2 and parts[-2] not in {'.', ''}:
        # Preserve a useful org/model style when the directory structure has it.
        return '/'.join(parts[-2:]).replace('--', '/')
    return path.stem.replace('--', '/')


def scan_on_device_models(root: Path, *, max_files: int = 5000) -> tuple[list[LocalModelRecord], list[str]]:
    """Find local model files/directories under a configured root.

    This is intentionally heuristic and read-only. It does not mutate HF cache or
    model directories. It looks for common vLLM-loadable HF snapshot folders and
    GGUF files so the UI can show an LM Studio-like on-device list.
    """
    records: list[LocalModelRecord] = []
    warnings: list[str] = []
    if not root.exists():
        return records, warnings
    seen_paths: set[str] = set()

    def add_path(path: Path, source: str) -> None:
        key = str(path)
        if key in seen_paths:
            return
        seen_paths.add(key)
        model_id = _local_model_id_from_path(path, root)
        size = dir_size(path)
        metadata = _detect_local_metadata(path, model_id)
        tag_bits = [source, 'on-device']
        if metadata.get('format'):
            tag_bits.append(str(metadata['format']).lower())
        if metadata.get('quantization'):
            tag_bits.append(str(metadata['quantization']).lower())
        records.append(LocalModelRecord(
            id=f'{source}:{_safe_id(model_id)}:{_safe_id(str(path))[-24:]}',
            model_id=model_id,
            display_name=path.stem if path.is_file() else model_id.split('/')[-1],
            source=source,
            local_path=str(path),
            size_bytes=size,
            size_label=format_size(size),
            tags=sorted(set(tag_bits)),
            last_modified=_path_mtime(path),
            notes=f'Discovered from {root}',
            **metadata,
        ))

    # Direct child dirs first; this keeps scans cheap for huge disks.
    try:
        children = list(root.iterdir())
    except OSError as exc:
        return records, [f'Could not scan {root}: {exc}']
    for child in children:
        if child.is_dir() and _looks_like_model_dir(child):
            add_path(_best_hf_snapshot_path(child), 'local-scan')
        elif child.is_file() and child.suffix.lower() in {'.gguf', '.safetensors'}:
            add_path(child, 'local-file')

    # Find nested model folders and GGUF files because users often keep
    # /models/vendor/model/variant.gguf or /models/org/model/config.json.
    scanned = 0
    try:
        for item in root.rglob('*'):
            scanned += 1
            if scanned > max_files:
                warnings.append(f'Stopped scanning {root} after {max_files} candidates.')
                break
            if item.is_file() and item.suffix.lower() == '.gguf':
                add_path(item, 'gguf-file')
            elif item.is_dir() and _looks_like_model_dir(item):
                add_path(_best_hf_snapshot_path(item), 'local-scan')
    except OSError as exc:
        warnings.append(f'Could not recursively scan models under {root}: {exc}')
    return records, warnings

def scan_hf_cache_models(user_roots: list[str] | None = None) -> tuple[list[LocalModelRecord], list[str], list[str]]:
    records: list[LocalModelRecord] = []
    scanned: list[str] = []
    warnings: list[str] = []
    seen: set[str] = set()
    for root in _hf_cache_roots(user_roots):
        scanned.append(str(root))
        if not root.exists():
            continue
        try:
            children = list(root.iterdir())
        except OSError as exc:
            warnings.append(f'Could not scan {root}: {exc}')
            continue
        extra_records, extra_warnings = scan_on_device_models(root)
        for record in extra_records:
            seen_key = record.id if record.source in {'gguf-file', 'local-file', 'local-scan'} else record.model_id
            if seen_key not in seen:
                seen.add(seen_key)
                records.append(record)
        warnings.extend(extra_warnings)
        for child in children:
            if not child.is_dir():
                continue
            model_id = _model_id_from_hf_cache_dir(child)
            local_path = child
            source = 'hf-cache'
            if model_id is None:
                # Support simple ./models/org--model or ./models/model folders too.
                if root.name != 'models':
                    continue
                model_id = child.name.replace('--', '/')
                source = 'local-dir'
            if model_id in seen:
                continue
            seen.add(model_id)
            best_path = _best_hf_snapshot_path(local_path)
            size = dir_size(local_path)
            metadata = _detect_local_metadata(best_path, model_id)
            records.append(
                LocalModelRecord(
                    id=f'{source}:{_safe_id(model_id)}',
                    model_id=model_id,
                    display_name=model_id.split('/')[-1],
                    source=source,
                    local_path=str(best_path),
                    size_bytes=size,
                    size_label=format_size(size),
                    tags=sorted(set([source, 'on-device'] + ([metadata['format'].lower()] if metadata.get('format') else []))),
                    last_modified=_path_mtime(local_path),
                    notes=f'Discovered from {root}',
                    **metadata,
                )
            )
    return records, scanned, warnings


async def list_scan_roots_summary() -> tuple[list[LocalModelScanRoot], list[str], list[str]]:
    user_roots = await get_user_scan_roots()
    roots: list[LocalModelScanRoot] = []
    warnings: list[str] = []
    for root, source in _scan_roots_with_sources(user_roots):
        path_str = str(root)
        exists = root.exists()
        count = 0
        root_warnings: list[str] = []
        if exists:
            records, root_warnings = scan_on_device_models(root, max_files=5000)
            count = len(records)
        elif source == 'app-scan-path':
            root_warnings.append('Path does not exist yet or the controller cannot access it.')
        roots.append(LocalModelScanRoot(path=path_str, source=source, exists=exists, model_count=count, warnings=root_warnings))
        warnings.extend(root_warnings)
    return roots, user_roots, warnings


async def list_local_model_records() -> tuple[list[LocalModelRecord], list[str], list[str]]:
    records_by_model: dict[str, LocalModelRecord] = {}
    user_roots = await get_user_scan_roots()
    scanned_records, scanned_paths, warnings = scan_hf_cache_models(user_roots)
    for record in scanned_records:
        key = record.model_id
        if key in records_by_model and records_by_model[key].local_path != record.local_path:
            key = record.id
        records_by_model[key] = record

    model_rows = await fetchall('SELECT * FROM models ORDER BY updated_at DESC')
    for row in model_rows:
        tags = loads_json(row['tags_json'])
        local_path = row.get('local_path')
        model_id = row['model_id']
        path_obj = Path(local_path).expanduser() if local_path else None
        size = dir_size(path_obj) if path_obj else None
        metadata = _detect_local_metadata(path_obj, model_id)
        existing = records_by_model.get(model_id)
        records_by_model[model_id] = LocalModelRecord(
            id=f'registry:{row["id"]}',
            model_id=model_id,
            display_name=row['display_name'],
            source='registry',
            local_path=local_path or existing.local_path if existing else local_path,
            size_bytes=size if size is not None else (existing.size_bytes if existing else None),
            size_label=format_size(size) if size is not None else (existing.size_label if existing else None),
            tags=sorted(set(tags + ['registered', 'on-device'] + (existing.tags if existing else []) + ([metadata['format'].lower()] if metadata.get('format') else []))),
            format=metadata.get('format') or (existing.format if existing else None),
            quantization=metadata.get('quantization') or (existing.quantization if existing else None),
            architecture=metadata.get('architecture') or (existing.architecture if existing else None),
            context_length=metadata.get('context_length') or (existing.context_length if existing else None),
            parameter_count_b=metadata.get('parameter_count_b') or (existing.parameter_count_b if existing else None),
            variant_count=metadata.get('variant_count') or (existing.variant_count if existing else None),
            file_count=metadata.get('file_count') or (existing.file_count if existing else None),
            weight_file_count=metadata.get('weight_file_count') or (existing.weight_file_count if existing else None),
            is_multi_file=metadata.get('is_multi_file') if metadata.get('is_multi_file') is not None else (existing.is_multi_file if existing else False),
            config_present=metadata.get('config_present') if metadata.get('config_present') is not None else (existing.config_present if existing else False),
            tokenizer_present=metadata.get('tokenizer_present') if metadata.get('tokenizer_present') is not None else (existing.tokenizer_present if existing else None),
            dtype_hint=metadata.get('dtype_hint') or (existing.dtype_hint if existing else None),
            compatibility_status=metadata.get('compatibility_status') or (existing.compatibility_status if existing else 'unknown'),
            compatibility_label=metadata.get('compatibility_label') or (existing.compatibility_label if existing else None),
            compatibility_reasons=metadata.get('compatibility_reasons') or (existing.compatibility_reasons if existing else []),
            suggested_load_format=metadata.get('suggested_load_format') or (existing.suggested_load_format if existing else None),
            metadata_warnings=metadata.get('metadata_warnings') or (existing.metadata_warnings if existing else []),
            registered_model_id=row['id'],
            last_modified=row['updated_at'],
            notes=row.get('notes') or (existing.notes if existing else None),
        )

    download_rows = await fetchall('SELECT * FROM model_download_jobs ORDER BY updated_at DESC')
    for row in download_rows:
        model_id = row['model_id']
        existing = records_by_model.get(model_id)
        local_dir = row.get('local_dir') or (existing.local_path if existing else None)
        path_obj = Path(local_dir).expanduser() if local_dir else None
        size = dir_size(path_obj) if path_obj and path_obj.exists() else (existing.size_bytes if existing else None)
        metadata = _detect_local_metadata(path_obj, model_id)
        records_by_model[model_id] = LocalModelRecord(
            id=existing.id if existing else f'download:{row["id"]}',
            model_id=model_id,
            display_name=existing.display_name if existing else model_id.split('/')[-1],
            source=existing.source if existing else 'download-job',
            local_path=local_dir,
            size_bytes=size,
            size_label=format_size(size),
            tags=sorted(set((existing.tags if existing else []) + ['download-job', 'on-device'] + ([metadata['format'].lower()] if metadata.get('format') else []))),
            format=metadata.get('format') or (existing.format if existing else None),
            quantization=metadata.get('quantization') or (existing.quantization if existing else None),
            architecture=metadata.get('architecture') or (existing.architecture if existing else None),
            context_length=metadata.get('context_length') or (existing.context_length if existing else None),
            parameter_count_b=metadata.get('parameter_count_b') or (existing.parameter_count_b if existing else None),
            variant_count=metadata.get('variant_count') or (existing.variant_count if existing else None),
            file_count=metadata.get('file_count') or (existing.file_count if existing else None),
            weight_file_count=metadata.get('weight_file_count') or (existing.weight_file_count if existing else None),
            is_multi_file=metadata.get('is_multi_file') if metadata.get('is_multi_file') is not None else (existing.is_multi_file if existing else False),
            config_present=metadata.get('config_present') if metadata.get('config_present') is not None else (existing.config_present if existing else False),
            tokenizer_present=metadata.get('tokenizer_present') if metadata.get('tokenizer_present') is not None else (existing.tokenizer_present if existing else None),
            dtype_hint=metadata.get('dtype_hint') or (existing.dtype_hint if existing else None),
            compatibility_status=metadata.get('compatibility_status') or (existing.compatibility_status if existing else 'unknown'),
            compatibility_label=metadata.get('compatibility_label') or (existing.compatibility_label if existing else None),
            compatibility_reasons=metadata.get('compatibility_reasons') or (existing.compatibility_reasons if existing else []),
            suggested_load_format=metadata.get('suggested_load_format') or (existing.suggested_load_format if existing else None),
            metadata_warnings=metadata.get('metadata_warnings') or (existing.metadata_warnings if existing else []),
            registered_model_id=existing.registered_model_id if existing else row.get('registered_model_id'),
            download_job_id=row['id'],
            download_status=row['status'],
            last_modified=row['updated_at'],
            notes=row.get('message') or (existing.notes if existing else None),
        )

    instance_rows = await fetchall('SELECT * FROM instances ORDER BY updated_at DESC')
    path_to_model_key: dict[str, str] = {}
    for key, record in records_by_model.items():
        if record.local_path:
            path_to_model_key[record.local_path] = key

    for row in instance_rows:
        config = VllmServeConfig(**loads_json(row['config_json']))
        key = path_to_model_key.get(config.model, config.model)
        model_id = config.model if key == config.model else records_by_model[key].model_id
        existing = records_by_model.get(key)
        if existing:
            if row['id'] not in existing.matching_instance_ids:
                existing.matching_instance_ids.append(row['id'])
            if row['status'] == 'running' and row['id'] not in existing.running_instance_ids:
                existing.running_instance_ids.append(row['id'])
            if row['status'] in {'stopped', 'crashed'} and row['id'] not in existing.stopped_instance_ids:
                existing.stopped_instance_ids.append(row['id'])
            existing.loaded_instance_count = len(existing.running_instance_ids)
            existing.configured_instance_count = len(existing.matching_instance_ids)
            should_promote = row['status'] == 'running' or existing.active_instance_id is None
            if should_promote:
                existing.active_instance_id = row['id']
                existing.active_status = row['status']
                existing.active_last_error = row.get('last_error')
            elif row['status'] == 'crashed' and existing.active_last_error is None:
                # Keep the most recent crash reason available for model rows even
                # when a stopped/running sibling instance is selected as active.
                existing.active_last_error = row.get('last_error')
        else:
            records_by_model[model_id] = LocalModelRecord(
                id=f'instance:{row["id"]}',
                model_id=model_id,
                display_name=model_id.split('/')[-1],
                source='instance',
                tags=['instance', 'loaded' if row['status'] == 'running' else 'configured'],
                active_instance_id=row['id'],
                active_status=row['status'],
                active_last_error=row.get('last_error'),
                matching_instance_ids=[row['id']],
                running_instance_ids=[row['id']] if row['status'] == 'running' else [],
                stopped_instance_ids=[row['id']] if row['status'] in {'stopped', 'crashed'} else [],
                loaded_instance_count=1 if row['status'] == 'running' else 0,
                configured_instance_count=1,
                last_modified=row['updated_at'],
                notes='Model referenced by an existing instance.',
            )

    records = list(records_by_model.values())
    records.sort(key=lambda r: (0 if r.active_status == 'running' else 1, r.display_name.lower(), r.local_path or ''))
    # Populate group/variant metadata on every record so existing endpoints can render
    # grouped local variants without needing a second backend round trip.
    group_local_model_records(records)
    return records, scanned_paths, warnings



_QUANT_ORDER = {
    'Q2': 20,
    'Q3': 30,
    'Q4': 40,
    'Q5': 50,
    'Q6': 60,
    'Q8': 80,
    'FP8': 85,
    'F16': 90,
    'FP16': 90,
    'BF16': 91,
    'SAFETENSORS': 95,
    'HF SNAPSHOT': 96,
}


def _variant_rank(record: LocalModelRecord) -> int:
    if record.active_status == 'running':
        return 0
    label = (record.quantization or record.format or '').upper().replace('-', '_')
    for prefix, rank in _QUANT_ORDER.items():
        if label.startswith(prefix):
            return rank
    if record.size_bytes:
        # Smaller local quant files should appear before giant snapshots when rank is otherwise unknown.
        return 70
    return 100


def _strip_quant_suffix(name: str) -> str:
    cleaned = re.sub(r'\.(gguf|safetensors|bin)$', '', name, flags=re.IGNORECASE)
    cleaned = re.sub(r'(?i)([-_. ](?:IQ\d|Q\d(?:_K)?(?:_[A-Z0-9]+)?|Q\d_\d|F16|FP16|BF16|FP8|AWQ|GPTQ))+$', '', cleaned)
    cleaned = re.sub(r'[-_. ]+$', '', cleaned)
    return cleaned or name


def _group_name_for_record(record: LocalModelRecord) -> str:
    if record.local_path:
        path = Path(record.local_path)
        if path.is_file():
            parent = path.parent.name.replace('--', '/')
            return parent if parent and parent not in {'.', '/'} else _strip_quant_suffix(path.stem)
    return _strip_quant_suffix(record.display_name or record.model_id.split('/')[-1])


def _group_id_for_record(record: LocalModelRecord) -> str:
    if record.local_path:
        path = Path(record.local_path)
        if path.suffix.lower() == '.gguf' and path.parent.name:
            return f'path:{_safe_id(str(path.parent))}'
        if path.is_dir() and record.format == 'GGUF':
            return f'path:{_safe_id(str(path))}'
        if path.is_dir() and path.parent.name == 'snapshots':
            return f'hf:{_safe_id(record.model_id)}'
    return f'model:{_safe_id(_strip_quant_suffix(record.model_id))}'


def _variant_label_for_record(record: LocalModelRecord) -> str:
    bits: list[str] = []
    if record.quantization:
        bits.append(record.quantization)
    elif record.format:
        bits.append(record.format)
    if record.local_path:
        path = Path(record.local_path)
        if path.is_file():
            bits.append(path.name)
        elif path.parent.name == 'snapshots':
            bits.append(f'snapshot {path.name[:8]}')
    if record.size_label:
        bits.append(record.size_label)
    return ' · '.join(bits) if bits else record.display_name


def group_local_model_records(records: list[LocalModelRecord]) -> list[LocalModelVariantGroup]:
    grouped: dict[str, list[LocalModelRecord]] = {}
    for record in records:
        gid = _group_id_for_record(record)
        record.group_id = gid
        record.group_name = _group_name_for_record(record)
        record.variant_label = _variant_label_for_record(record)
        record.variant_rank = _variant_rank(record)
        grouped.setdefault(gid, []).append(record)

    groups: list[LocalModelVariantGroup] = []
    for gid, variants in grouped.items():
        if any(item.local_path and Path(item.local_path).suffix.lower() == '.gguf' for item in variants):
            variants = [item for item in variants if not (item.local_path and Path(item.local_path).is_dir() and item.format == 'GGUF')] or variants
        variants.sort(key=lambda item: (item.variant_rank, item.display_name.lower(), item.local_path or ''))
        for variant in variants:
            variant.sibling_variant_count = len(variants)
        loaded = next((item for item in variants if item.active_status == 'running'), None)
        preferred = loaded or variants[0]
        total_size = sum(item.size_bytes or 0 for item in variants) or None
        group = LocalModelVariantGroup(
            id=gid,
            name=preferred.group_name or preferred.display_name,
            model_id=preferred.model_id,
            display_name=preferred.group_name or preferred.display_name,
            variants=variants,
            preferred_variant_id=preferred.id,
            loaded_variant_id=loaded.id if loaded else None,
            loaded_instance_count=sum(item.loaded_instance_count for item in variants),
            configured_instance_count=sum(item.configured_instance_count for item in variants),
            total_size_bytes=total_size,
            total_size_label=format_size(total_size),
            sources=sorted({item.source for item in variants if item.source}),
            formats=sorted({item.format for item in variants if item.format}),
            quantizations=sorted({item.quantization for item in variants if item.quantization}),
            local_paths=[item.local_path for item in variants if item.local_path],
        )
        groups.append(group)
    groups.sort(key=lambda group: (0 if group.loaded_instance_count else 1, group.display_name.lower()))
    return groups


def _request_model_refs(request) -> set[str]:
    refs = {request.model_id}
    if request.local_path:
        refs.add(request.local_path)
    return refs


LOW_VRAM_MAX_MODEL_LEN = 4096
LOW_VRAM_GPU_MEMORY_UTILIZATION = 0.80
LOW_VRAM_EXTRA_ARGS = ['--max-num-seqs', '8']


def _append_missing_extra_args(extra_args: list[str], additions: list[str]) -> list[str]:
    merged = list(extra_args)
    for index in range(0, len(additions), 2):
        flag = additions[index]
        value = additions[index + 1] if index + 1 < len(additions) else None
        if flag in merged:
            continue
        merged.append(flag)
        if value is not None:
            merged.append(value)
    return merged


def _low_vram_max_model_len(request) -> int:
    # Keep this intentionally conservative and local. Large Qwen/Qwen3.x text
    # models stay runnable; this preset only lowers serving pressure after a
    # user asks for the safer retry path.
    candidate = request.max_model_len
    if candidate is None and request.local_path:
        metadata = _detect_local_metadata(Path(request.local_path).expanduser(), request.model_id)
        context_length = metadata.get('context_length')
        if isinstance(context_length, int) and context_length > 0:
            candidate = context_length
    if candidate is None:
        return LOW_VRAM_MAX_MODEL_LEN
    return max(1, min(int(candidate), LOW_VRAM_MAX_MODEL_LEN))


def _config_from_request(request) -> VllmServeConfig:
    model_ref = request.local_path or request.model_id
    gpu_memory_utilization = request.gpu_memory_utilization
    max_model_len = request.max_model_len
    extra_args = list(request.extra_args)
    if request.load_preset == 'low_vram':
        gpu_memory_utilization = min(gpu_memory_utilization, LOW_VRAM_GPU_MEMORY_UTILIZATION)
        max_model_len = _low_vram_max_model_len(request)
        extra_args = _append_missing_extra_args(extra_args, LOW_VRAM_EXTRA_ARGS)

    return VllmServeConfig(
        model=model_ref,
        host=request.host,
        port=request.port,
        api_key=request.api_key,
        served_model_name=request.served_model_name,
        dtype=request.dtype,
        gpu_memory_utilization=gpu_memory_utilization,
        max_model_len=max_model_len,
        kv_cache_memory_bytes=request.kv_cache_memory_bytes,
        tensor_parallel_size=request.tensor_parallel_size,
        pipeline_parallel_size=request.pipeline_parallel_size,
        trust_remote_code=request.trust_remote_code,
        enable_auto_tool_choice=request.enable_auto_tool_choice,
        tool_call_parser=request.tool_call_parser,
        reasoning_parser=request.reasoning_parser,
        extra_args=extra_args,
    )


async def find_existing_instance_for_local_model(request):
    refs = _request_model_refs(request)
    rows = await fetchall('SELECT * FROM instances ORDER BY updated_at DESC')
    matches = []
    for row in rows:
        config = VllmServeConfig(**loads_json(row['config_json']))
        if config.model in refs:
            matches.append(row)
    status_order = {'running': 0, 'starting': 1, 'stopped': 2, 'crashed': 3, 'stopping': 4}
    matches.sort(key=lambda row: (status_order.get(row['status'], 9), row['updated_at']))
    return matches[0] if matches else None


async def create_instance_for_local_model(request) -> tuple[str, bool, str]:
    instance_id = str(uuid4())
    ts = now_iso()
    config = _config_from_request(request)
    name = request.name or request.model_id.split('/')[-1].replace('.', '-').replace('_', '-').lower()

    if request.reuse_existing and not request.force_new:
        existing = await find_existing_instance_for_local_model(request)
        if existing:
            if existing['status'] in {'stopped', 'crashed'}:
                await execute(
                    'UPDATE instances SET name = ?, host = ?, port = ?, config_json = ?, updated_at = ? WHERE id = ?',
                    (name, request.host, request.port, dumps_json(config.model_dump()), ts, existing['id']),
                )
                return existing['id'], True, 'reused_stopped'
            return existing['id'], True, 'already_loaded' if existing['status'] == 'running' else 'reused_existing'

    await execute(
        'INSERT INTO instances(id, name, status, host, port, config_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        (instance_id, name, 'stopped', request.host, request.port, dumps_json(config.model_dump()), ts, ts),
    )
    return instance_id, False, 'created'
