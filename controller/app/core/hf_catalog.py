from __future__ import annotations

import os
import re
from typing import TYPE_CHECKING, Any, Literal
from urllib.parse import urlencode

import httpx

from app.schemas.model_hub import CatalogModelRecord

if TYPE_CHECKING:
    from app.schemas.model_hub import HfModelVariant

HF_MODELS_API = 'https://huggingface.co/api/models'

HfDiscoveryMode = Literal['trending', 'most_downloaded', 'most_liked', 'recently_updated', 'search']

SORT_BY_MODE: dict[str, str] = {
    # HF's own trending list is based on likes over the last 7 days.
    # See huggingface_hub issue #2427 / maintainer guidance.
    'trending': 'likes7d',
    'most_downloaded': 'downloads',
    'most_liked': 'likes',
    'recently_updated': 'lastModified',
    'search': 'downloads',
}

DEFAULT_TASK_FILTERS: dict[str, list[str]] = {
    'llm': ['text-generation', 'transformers'],
    'chat': ['text-generation', 'conversational'],
    'coding': ['text-generation'],
    'embedding': ['sentence-transformers'],
    'vision': ['image-text-to-text'],
}


def safe_catalog_id(model_id: str) -> str:
    return 'hf-' + re.sub(r'[^a-z0-9]+', '-', model_id.lower()).strip('-')[:96]


def infer_parameter_count_b(model_id: str) -> float | None:
    match = re.search(r'(?<![a-z0-9])([0-9]+(?:\.[0-9]+)?)\s*([bm])(?![a-z0-9])', model_id, re.I)
    if not match:
        return None
    value = float(match.group(1))
    return value if match.group(2).lower() == 'b' else value / 1000


def infer_size_label(model_id: str) -> str | None:
    params = infer_parameter_count_b(model_id)
    if params is None:
        return None
    if params < 1:
        return f'{params * 1000:.0f}M'
    if float(params).is_integer():
        return f'{int(params)}B'
    return f'{params:g}B'


def infer_tags(model_id: str, raw_tags: list[str] | None = None, pipeline_tag: str | None = None) -> list[str]:
    lowered = model_id.lower()
    tags: list[str] = ['huggingface']
    if pipeline_tag:
        tags.append(pipeline_tag)
    if 'qwen' in lowered:
        tags.append('qwen')
    if 'coder' in lowered or 'code' in lowered:
        tags.extend(['coding', 'agent'])
    if 'llama' in lowered:
        tags.append('llama')
    if 'mistral' in lowered or 'mixtral' in lowered:
        tags.append('mistral')
    if 'deepseek' in lowered:
        tags.append('deepseek')
    if 'gemma' in lowered:
        tags.append('gemma')
    if 'instruct' in lowered or 'chat' in lowered:
        tags.append('instruct')
    if 'embedding' in lowered or pipeline_tag == 'feature-extraction':
        tags.append('embedding')
    if infer_parameter_count_b(model_id) and infer_parameter_count_b(model_id) >= 14:
        tags.append('dgx')
    for tag in raw_tags or []:
        if not isinstance(tag, str):
            continue
        if tag.startswith('safetensors'):
            tags.append('safetensors')
        if tag in {'gguf', 'awq', 'gptq', 'fp8', 'transformers', 'text-generation'}:
            tags.append(tag)
    out: list[str] = []
    for tag in tags:
        clean = tag.lower().strip().replace('_', '-')
        if clean and clean not in out:
            out.append(clean)
    return out[:14]


def hf_item_to_catalog_record(item: dict[str, Any]) -> CatalogModelRecord:
    model_id = str(item.get('modelId') or item.get('id') or '').strip()
    if not model_id:
        raise ValueError('Hugging Face result is missing modelId')
    tags = item.get('tags') if isinstance(item.get('tags'), list) else []
    pipeline_tag = item.get('pipeline_tag') if isinstance(item.get('pipeline_tag'), str) else None
    gated_value = item.get('gated')
    gated = bool(gated_value) and gated_value != 'false'
    updated_at = item.get('lastModified') or item.get('last_modified')
    trending_score = item.get('likes7d') or item.get('trendingScore') or item.get('trending_score')
    description_bits = [f'Downloads: {item.get("downloads", 0)}']
    if item.get('likes') is not None:
        description_bits.append(f'Likes: {item.get("likes")}')
    if updated_at:
        description_bits.append(f'Updated: {updated_at}')
    return CatalogModelRecord(
        id=safe_catalog_id(model_id),
        source='huggingface',
        model_id=model_id,
        display_name=model_id.split('/')[-1],
        description='Hugging Face discovery result. ' + '. '.join(description_bits) + '.',
        tags=infer_tags(model_id, tags, pipeline_tag),
        size_label=infer_size_label(model_id),
        parameter_count_b=infer_parameter_count_b(model_id),
        suggested_max_model_len=32768,
        gated=gated,
        trust_remote_code=False,
        notes='Discovered from Hugging Face at runtime. Some models require an HF token, accepted terms, quantization-specific args, or custom vLLM flags.',
        downloads=item.get('downloads') if isinstance(item.get('downloads'), int) else None,
        likes=item.get('likes') if isinstance(item.get('likes'), int) else None,
        pipeline_tag=pipeline_tag,
        last_modified=str(updated_at) if updated_at else None,
        trending_score=int(trending_score) if isinstance(trending_score, int) else None,
    )


def _query_params(
    *,
    query: str,
    limit: int,
    mode: HfDiscoveryMode,
    task: str | None,
    author: str | None,
    filters: list[str],
) -> str:
    params: list[tuple[str, str | int]] = [
        ('limit', limit),
        ('sort', SORT_BY_MODE.get(mode, 'downloads')),
        ('direction', -1),
        ('full', 'false'),
    ]
    cleaned_query = query.strip()
    if cleaned_query:
        params.append(('search', cleaned_query))
    if author and author.strip():
        params.append(('author', author.strip()))
    cleaned_filters = [item.strip() for item in filters if item.strip()]
    if task and task != 'all':
        cleaned_filters.extend(DEFAULT_TASK_FILTERS.get(task, [task]))
    for item in cleaned_filters:
        params.append(('filter', item))
    return urlencode(params)


async def discover_huggingface_models(
    query: str = '',
    *,
    limit: int = 20,
    hf_token_env: str | None = 'HF_TOKEN',
    mode: HfDiscoveryMode = 'trending',
    task: str | None = 'llm',
    author: str | None = None,
    filters: list[str] | None = None,
) -> list[CatalogModelRecord]:
    limit = max(1, min(limit, 100))
    headers: dict[str, str] = {}
    token = os.getenv(hf_token_env or '') if hf_token_env else None
    if token:
        headers['authorization'] = f'Bearer {token}'
    params = _query_params(query=query, limit=limit, mode=mode, task=task, author=author, filters=filters or [])
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(f'{HF_MODELS_API}?{params}', headers=headers)
    if response.status_code in {401, 403}:
        raise PermissionError('Hugging Face rejected the request. Check the HF token environment variable and model access permissions.')
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, list):
        return []
    records: list[CatalogModelRecord] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        try:
            records.append(hf_item_to_catalog_record(item))
        except ValueError:
            continue
    return records


async def search_huggingface_models(query: str, *, limit: int = 20, hf_token_env: str | None = 'HF_TOKEN') -> list[CatalogModelRecord]:
    """Backward-compatible wrapper used by older tests/callers."""
    if not query.strip():
        return []
    return await discover_huggingface_models(query, limit=limit, hf_token_env=hf_token_env, mode='search', task=None)


def catalog_record_from_model_id(model_id: str, display_name: str | None = None, tags: list[str] | None = None) -> CatalogModelRecord:
    clean = model_id.strip()
    return CatalogModelRecord(
        id=safe_catalog_id(clean),
        source='huggingface',
        model_id=clean,
        display_name=display_name or clean.split('/')[-1],
        description='Hugging Face model selected from runtime discovery. Register/download/launch with vLLM.',
        tags=tags or infer_tags(clean),
        size_label=infer_size_label(clean),
        parameter_count_b=infer_parameter_count_b(clean),
        suggested_max_model_len=32768,
        notes='Imported from Hugging Face catalog/search.',
    )

# --- v20.1: Hugging Face quantization / file variant discovery ---

HF_MODEL_TREE_API = 'https://huggingface.co/api/models/{model_id}/tree/{revision}'


def format_bytes(num: int | None) -> str | None:
    if num is None:
        return None
    value = float(num)
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if value < 1024 or unit == 'TB':
            return f'{value:.1f} {unit}' if unit != 'B' else f'{int(value)} B'
        value /= 1024
    return f'{value:.1f} TB'


def infer_file_format(path: str) -> str:
    lower = path.lower()
    if lower.endswith('.gguf'):
        return 'GGUF'
    if lower.endswith('.safetensors') or lower.endswith('.safetensors.index.json'):
        return 'Safetensors'
    if lower.endswith('.bin'):
        return 'PyTorch bin'
    if lower.endswith('.mlx') or '/mlx' in lower:
        return 'MLX'
    if lower.endswith('.onnx'):
        return 'ONNX'
    return 'Unknown'


def infer_quantization_from_name(name: str) -> str | None:
    lower = name.lower().replace('-', '_')
    patterns = [
        r'q[2-8]_k_[msl]', r'q[2-8]_k', r'iq[1-4]_[a-z0-9_]+', r'q8_0', r'q6_k', r'q5_[01]', r'q4_[01]',
        r'f16', r'fp16', r'bf16', r'fp8', r'int8', r'int4', r'4bit', r'8bit', r'awq', r'gptq', r'gguf', r'mlx'
    ]
    for pattern in patterns:
        match = re.search(pattern, lower)
        if match:
            return match.group(0).upper().replace('_', '-')
    return None


def _variant_id(model_id: str, path: str) -> str:
    return safe_catalog_id(model_id + '-' + path)


def _variant_notes(fmt: str, quant: str | None, path: str) -> str:
    if fmt == 'GGUF':
        return 'Single GGUF file variant. vLLM GGUF support may require compatible vLLM version and tokenizer settings.'
    if quant in {'AWQ', 'GPTQ', 'FP8', 'INT4', '4BIT', '8BIT'}:
        return 'Quantized repo/file variant. Check vLLM support and quantization flags for this model family.'
    if fmt == 'Safetensors':
        return 'Transformers/safetensors variant. Good default for vLLM when the repo is supported.'
    return f'File variant discovered from Hugging Face path: {path}'


def tree_items_to_variants(model_id: str, items: list[dict[str, Any]]) -> list['HfModelVariant']:
    from app.schemas.model_hub import HfModelVariant

    variants: list[HfModelVariant] = []
    saw_safetensors = False
    safetensors_size = 0
    safetensors_count = 0
    for item in items:
        path = str(item.get('path') or item.get('rfilename') or '').strip()
        if not path:
            continue
        typ = item.get('type')
        if typ and typ != 'file':
            continue
        lower = path.lower()
        size = item.get('size') if isinstance(item.get('size'), int) else None
        quant = infer_quantization_from_name(path)
        if lower.endswith('.gguf'):
            variants.append(HfModelVariant(
                id=_variant_id(model_id, path), model_id=model_id, filename=path.split('/')[-1], path=path,
                format='GGUF', quantization=quant, size_bytes=size, size_label=format_bytes(size),
                recommended=bool(quant and quant in {'Q4-K-M', 'Q5-K-M', 'Q6-K', 'Q8-0'}),
                notes=_variant_notes('GGUF', quant, path), allow_patterns=[path],
            ))
        elif lower.endswith('.safetensors'):
            saw_safetensors = True
            safetensors_count += 1
            safetensors_size += size or 0
        elif lower.endswith('.safetensors.index.json'):
            saw_safetensors = True
        elif lower.endswith('.bin') and 'pytorch_model' in lower:
            # Only add a grouped PyTorch bin fallback once.
            pass
    if saw_safetensors:
        quant = infer_quantization_from_name(model_id)
        variants.insert(0, HfModelVariant(
            id=_variant_id(model_id, 'safetensors-snapshot'), model_id=model_id, filename='Safetensors snapshot', path='.',
            format='Safetensors', quantization=quant, size_bytes=safetensors_size or None, size_label=format_bytes(safetensors_size or None),
            recommended=True, notes=_variant_notes('Safetensors', quant, '.'), allow_patterns=['*.json', '*.model', '*.txt', '*.safetensors', '*.safetensors.index.json', 'tokenizer*', 'special_tokens_map.json'],
        ))
    # De-dupe and prioritize recommended then size/name.
    seen: set[str] = set()
    out: list[HfModelVariant] = []
    for variant in sorted(variants, key=lambda v: (not v.recommended, v.size_bytes or 0, v.filename)):
        if variant.path in seen:
            continue
        seen.add(variant.path)
        out.append(variant)
    return out[:80]


async def discover_huggingface_model_variants(
    model_id: str,
    *,
    revision: str | None = 'main',
    hf_token_env: str | None = 'HF_TOKEN',
) -> list['HfModelVariant']:
    model_id = model_id.strip()
    if not model_id:
        return []
    headers: dict[str, str] = {}
    token = os.getenv(hf_token_env or '') if hf_token_env else None
    if token:
        headers['authorization'] = f'Bearer {token}'
    url = HF_MODEL_TREE_API.format(model_id=model_id, revision=revision or 'main')
    params = urlencode({'recursive': '1', 'expand': '1'})
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(f'{url}?{params}', headers=headers)
    if response.status_code in {401, 403}:
        raise PermissionError('Hugging Face rejected the file listing request. Check HF token and model access permissions.')
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, list):
        return []
    return tree_items_to_variants(model_id, [item for item in data if isinstance(item, dict)])
