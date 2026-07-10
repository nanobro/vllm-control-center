from __future__ import annotations

import math
import re
from dataclasses import dataclass

from app.schemas.compatibility import (
    CompatibilityEstimate,
    CompatibilityRecommendation,
    CompatibilityRequest,
    CompatibilityResponse,
)

PARAM_RE = re.compile(r'(?P<count>\d+(?:\.\d+)?)\s*(?P<unit>b|m)\b', re.IGNORECASE)


@dataclass(frozen=True)
class ArchitectureSpec:
    hidden_size: int
    num_layers: int
    num_attention_heads: int
    num_kv_heads: int
    notes: tuple[str, ...] = ()

    @property
    def head_dim(self) -> int:
        return max(1, self.hidden_size // max(self.num_attention_heads, 1))


def infer_parameter_count_b(model_id: str) -> float | None:
    """Best-effort parameter count extraction from model names like Qwen3-32B or 560m."""
    candidates = [model_id.replace('-', ' '), model_id]
    for candidate in candidates:
        matches = list(PARAM_RE.finditer(candidate))
        if matches:
            match = matches[-1]
            count = float(match.group('count'))
            unit = match.group('unit').lower()
            return count if unit == 'b' else count / 1000
    return None


def infer_architecture_from_model_id(model_id: str) -> str:
    normalized = model_id.lower()
    if 'mixtral' in normalized:
        return 'mixtral'
    if 'mistral' in normalized:
        return 'mistral'
    if 'deepseek' in normalized:
        return 'deepseek'
    if 'qwen' in normalized:
        return 'qwen'
    if 'llama' in normalized or 'meta-llama' in normalized:
        return 'llama'
    return 'auto'


def _nearest_table_spec(parameter_count_b: float | None, table: list[tuple[float, ArchitectureSpec]]) -> ArchitectureSpec | None:
    if parameter_count_b is None:
        return None
    return min(table, key=lambda item: abs(item[0] - parameter_count_b))[1]


def architecture_spec(preset: str, parameter_count_b: float | None, model_id: str) -> tuple[ArchitectureSpec | None, list[str]]:
    """Return a transparent architecture estimate for common vLLM model families.

    The values are intentionally best-effort. The advisor is a planning guardrail,
    not a replacement for loading the model config.
    """
    notes: list[str] = []
    chosen = infer_architecture_from_model_id(model_id) if preset == 'auto' else preset
    if chosen == 'auto':
        notes.append('Architecture family unknown; using generic transformer estimates.')
    else:
        notes.append(f'Architecture preset: {chosen}.')

    qwen = [
        (0.5, ArchitectureSpec(1024, 24, 16, 16)),
        (1.5, ArchitectureSpec(1536, 28, 12, 2)),
        (3, ArchitectureSpec(2048, 36, 16, 2)),
        (7, ArchitectureSpec(3584, 28, 28, 4)),
        (14, ArchitectureSpec(5120, 48, 40, 8)),
        (32, ArchitectureSpec(5120, 64, 40, 8)),
        (72, ArchitectureSpec(8192, 80, 64, 8)),
    ]
    llama = [
        (1, ArchitectureSpec(2048, 16, 32, 8)),
        (3, ArchitectureSpec(3072, 28, 24, 8)),
        (7, ArchitectureSpec(4096, 32, 32, 32)),
        (8, ArchitectureSpec(4096, 32, 32, 8)),
        (13, ArchitectureSpec(5120, 40, 40, 40)),
        (34, ArchitectureSpec(8192, 48, 64, 8)),
        (70, ArchitectureSpec(8192, 80, 64, 8)),
    ]
    mistral = [
        (7, ArchitectureSpec(4096, 32, 32, 8)),
        (22, ArchitectureSpec(6144, 56, 48, 8)),
    ]
    deepseek = [
        (7, ArchitectureSpec(4096, 32, 32, 32, ('DeepSeek dense estimate.',))),
        (32, ArchitectureSpec(5120, 64, 40, 8, ('DeepSeek/Qwen-style dense estimate.',))),
        (67, ArchitectureSpec(8192, 80, 64, 8)),
    ]
    mixtral = [
        (47, ArchitectureSpec(4096, 32, 32, 8, ('Mixtral MoE total parameters; active memory may differ from dense estimates.',))),
    ]
    generic = [
        (1, ArchitectureSpec(2048, 24, 16, 16)),
        (3, ArchitectureSpec(3072, 32, 24, 8)),
        (7, ArchitectureSpec(4096, 32, 32, 8)),
        (14, ArchitectureSpec(5120, 40, 40, 8)),
        (32, ArchitectureSpec(5120, 64, 40, 8)),
        (70, ArchitectureSpec(8192, 80, 64, 8)),
        (100, ArchitectureSpec(12288, 96, 96, 8)),
    ]
    tables = {'qwen': qwen, 'llama': llama, 'mistral': mistral, 'mixtral': mixtral, 'deepseek': deepseek, 'auto': generic, 'custom': generic}
    spec = _nearest_table_spec(parameter_count_b, tables.get(chosen, generic))
    if spec:
        notes.extend(spec.notes)
        notes.append(
            'Estimated architecture: '
            f'hidden={spec.hidden_size}, layers={spec.num_layers}, '
            f'attention_heads={spec.num_attention_heads}, kv_heads={spec.num_kv_heads}, head_dim={spec.head_dim}.'
        )
    return spec, notes


def bytes_per_param(dtype: str, quantization_bits: int | None) -> float:
    if quantization_bits:
        return quantization_bits / 8
    normalized = dtype.lower()
    if normalized in {'float32', 'fp32'}:
        return 4
    if normalized in {'int8', '8bit'}:
        return 1
    if normalized in {'int4', '4bit'}:
        return 0.5
    # vLLM auto is usually fp16/bf16 for common GPU serving workloads.
    return 2


def bytes_per_cache_token(cache_dtype: str) -> float:
    normalized = cache_dtype.lower()
    if normalized in {'fp8', 'fp8_e4m3', 'fp8_e5m2'}:
        return 1
    # auto usually means model dtype for KV cache in common vLLM GPU serving.
    return 2


def _build_vllm_args(settings: dict[str, object]) -> list[str]:
    args: list[str] = []
    if settings.get('dtype') and settings['dtype'] != 'auto':
        args.extend(['--dtype', str(settings['dtype'])])
    if settings.get('max_model_len'):
        args.extend(['--max-model-len', str(settings['max_model_len'])])
    if settings.get('gpu_memory_utilization'):
        args.extend(['--gpu-memory-utilization', str(settings['gpu_memory_utilization'])])
    if settings.get('tensor_parallel_size') and settings['tensor_parallel_size'] != 1:
        args.extend(['--tensor-parallel-size', str(settings['tensor_parallel_size'])])
    if settings.get('cache_dtype') and settings['cache_dtype'] != 'auto':
        args.extend(['--kv-cache-dtype', str(settings['cache_dtype'])])
    return args


def estimate_compatibility(req: CompatibilityRequest) -> CompatibilityResponse:
    assumptions: list[str] = []
    warnings: list[str] = []

    parameter_count_b = req.parameter_count_b or infer_parameter_count_b(req.model_id)
    if parameter_count_b is None:
        warnings.append('Could not infer parameter count from model name. Enter parameters manually for a better estimate.')
    else:
        assumptions.append(f'Parameter count treated as {parameter_count_b:g}B parameters.')

    inferred_spec, architecture_notes = architecture_spec(req.architecture, parameter_count_b, req.model_id)
    assumptions.extend(architecture_notes)

    hidden_size = req.hidden_size or (inferred_spec.hidden_size if inferred_spec else None)
    num_layers = req.num_layers or (inferred_spec.num_layers if inferred_spec else None)
    num_attention_heads = req.num_attention_heads or (inferred_spec.num_attention_heads if inferred_spec else None)
    num_kv_heads = req.num_kv_heads or (inferred_spec.num_kv_heads if inferred_spec else None)
    head_dim = req.head_dim or (inferred_spec.head_dim if inferred_spec else None)
    if hidden_size and num_attention_heads and not head_dim:
        head_dim = max(1, hidden_size // num_attention_heads)

    model_weights_mb: int | None = None
    kv_cache_mb: int | None = None
    overhead_mb: int | None = None
    safety_margin_mb: int | None = None
    required_mb: int | None = None

    weight_bytes = bytes_per_param(req.dtype, req.quantization_bits)
    if parameter_count_b is not None:
        model_weights_mb = math.ceil(parameter_count_b * 1_000_000_000 * weight_bytes / (1024 * 1024))
        assumptions.append(f'Model weights estimated with {weight_bytes:g} bytes per parameter.')
        if req.quantization_bits:
            assumptions.append('Quantization estimate assumes the selected model/runtime truly uses quantized weights.')

    if num_layers and num_kv_heads and head_dim:
        cache_bytes = bytes_per_cache_token(req.cache_dtype)
        kv_cache_mb = math.ceil(req.max_model_len * req.expected_concurrency * num_layers * 2 * num_kv_heads * head_dim * cache_bytes / (1024 * 1024))
        assumptions.append('KV cache estimated as context_length × concurrency × layers × K/V × kv_heads × head_dim × cache_bytes.')
        if req.expected_concurrency > 1:
            assumptions.append(f'Expected concurrency={req.expected_concurrency} scales the KV cache estimate linearly.')
    else:
        warnings.append('KV cache estimate unavailable because layer/head information is unknown.')

    if model_weights_mb is not None or kv_cache_mb is not None:
        subtotal = (model_weights_mb or 0) + (kv_cache_mb or 0)
        overhead_mb = math.ceil(max(1024, subtotal * 0.08))
        safety_margin_mb = math.ceil(subtotal * (req.safety_margin_percent / 100))
        required_mb = math.ceil((subtotal + overhead_mb + safety_margin_mb) / max(req.tensor_parallel_size, 1))
        assumptions.append(f'Required memory is divided across tensor_parallel_size={req.tensor_parallel_size}.')

    usable_memory_mb = None
    if req.gpu_memory_free_mb:
        usable_memory_mb = math.floor(req.gpu_memory_free_mb * req.gpu_memory_utilization)
        assumptions.append('Used free GPU memory because gpu_memory_free_mb was provided.')
    elif req.gpu_memory_total_mb:
        usable_memory_mb = math.floor(req.gpu_memory_total_mb * req.gpu_memory_utilization)
        assumptions.append('Used total GPU memory × gpu_memory_utilization because free memory was not provided.')
    else:
        warnings.append('GPU memory not provided. Verdict is unknown; use Setup Doctor or enter GPU memory manually.')

    memory_gap_mb = None
    verdict = 'unknown'
    confidence = 'low'
    if required_mb is not None and usable_memory_mb is not None:
        memory_gap_mb = usable_memory_mb - required_mb
        ratio = required_mb / max(usable_memory_mb, 1)
        if ratio <= 0.85:
            verdict = 'likely_fits'
            confidence = 'medium'
        elif ratio <= 1.0:
            verdict = 'borderline'
            confidence = 'medium'
        else:
            verdict = 'unlikely'
            confidence = 'medium'
        if parameter_count_b is not None and num_layers and num_kv_heads and head_dim:
            confidence = 'high'

    if req.max_model_len >= 65536:
        warnings.append('Very long context can dominate KV cache memory. Treat this estimate as optimistic for some architectures.')
    if req.dtype == 'auto':
        assumptions.append('dtype=auto is treated as fp16/bf16 memory for estimation.')
    if req.cache_dtype == 'auto':
        assumptions.append('cache_dtype=auto is treated as fp16/bf16 KV cache memory.')
    if req.tensor_parallel_size > 1:
        warnings.append('Tensor parallelism requires compatible multi-GPU topology and vLLM support for the selected model/runtime.')

    settings: dict[str, object] = {
        'dtype': req.dtype,
        'max_model_len': req.max_model_len,
        'gpu_memory_utilization': min(req.gpu_memory_utilization, 0.92),
        'tensor_parallel_size': req.tensor_parallel_size,
        'cache_dtype': req.cache_dtype,
    }
    if req.quantization_bits:
        settings['quantization_bits'] = req.quantization_bits

    recommendations: list[CompatibilityRecommendation] = []
    if verdict in {'unlikely', 'borderline'}:
        shorter_context = max(2048, req.max_model_len // 2)
        recommendations.append(CompatibilityRecommendation(
            title='Reduce context length',
            description=f'Try max_model_len={shorter_context} to reduce KV cache pressure.',
            config_patch={'max_model_len': shorter_context},
            vllm_args=['--max-model-len', str(shorter_context)],
        ))
        if req.tensor_parallel_size == 1:
            recommendations.append(CompatibilityRecommendation(
                title='Use more tensor parallelism',
                description='If multiple GPUs are available, increase tensor_parallel_size to split memory across GPUs.',
                config_patch={'tensor_parallel_size': 2},
                vllm_args=['--tensor-parallel-size', '2'],
            ))
        if not req.quantization_bits:
            recommendations.append(CompatibilityRecommendation(
                title='Try quantized weights',
                description='A 4-bit or 8-bit variant can significantly reduce model weight memory.',
                config_patch={'quantization_bits': 4},
                vllm_args=[],
            ))
        if req.cache_dtype == 'auto':
            recommendations.append(CompatibilityRecommendation(
                title='Try FP8 KV cache if supported',
                description='For supported GPUs/models, FP8 KV cache can reduce context memory pressure.',
                config_patch={'cache_dtype': 'fp8'},
                vllm_args=['--kv-cache-dtype', 'fp8'],
            ))
    else:
        recommendations.append(CompatibilityRecommendation(
            title='Create a safe launch recipe',
            description='Use the current settings with a conservative GPU memory utilization.',
            config_patch={'gpu_memory_utilization': settings['gpu_memory_utilization'], 'max_model_len': req.max_model_len},
            vllm_args=_build_vllm_args(settings),
        ))

    summary = {
        'likely_fits': 'Likely fits with the provided memory budget.',
        'borderline': 'Borderline: it may fit, but small overhead changes can cause OOM.',
        'unlikely': 'Unlikely to fit with these settings.',
        'unknown': 'Not enough information for a fit verdict.',
    }[verdict]

    return CompatibilityResponse(
        verdict=verdict,
        confidence=confidence,
        summary=summary,
        estimate=CompatibilityEstimate(
            model_weights_mb=model_weights_mb,
            kv_cache_mb=kv_cache_mb,
            overhead_mb=overhead_mb,
            safety_margin_mb=safety_margin_mb,
            estimated_required_mb=required_mb,
            usable_gpu_memory_mb=usable_memory_mb,
            memory_gap_mb=memory_gap_mb,
        ),
        assumptions=assumptions,
        warnings=warnings,
        recommendations=recommendations,
        suggested_vllm_settings=settings,
        copyable_vllm_args=_build_vllm_args(settings),
        architecture_used={
            'architecture': infer_architecture_from_model_id(req.model_id) if req.architecture == 'auto' else req.architecture,
            'hidden_size': hidden_size,
            'num_layers': num_layers,
            'num_attention_heads': num_attention_heads,
            'num_kv_heads': num_kv_heads,
            'head_dim': head_dim,
            'expected_concurrency': req.expected_concurrency,
        },
    )
