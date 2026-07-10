from app.core.compatibility import estimate_compatibility, infer_architecture_from_model_id, infer_parameter_count_b
from app.schemas.compatibility import CompatibilityRequest


def test_infer_parameter_count_from_model_name():
    assert infer_parameter_count_b('Qwen/Qwen3-32B') == 32
    assert infer_parameter_count_b('tiny-560m') == 0.56


def test_infer_architecture_from_model_family():
    assert infer_architecture_from_model_id('Qwen/Qwen3-32B') == 'qwen'
    assert infer_architecture_from_model_id('meta-llama/Llama-3.1-8B-Instruct') == 'llama'
    assert infer_architecture_from_model_id('mistralai/Mixtral-8x7B-Instruct') == 'mixtral'


def test_likely_fits_small_model_on_large_gpu():
    result = estimate_compatibility(
        CompatibilityRequest(
            model_id='Qwen/Qwen3-7B',
            architecture='qwen',
            max_model_len=8192,
            gpu_memory_total_mb=49152,
            gpu_memory_utilization=0.9,
        )
    )
    assert result.verdict == 'likely_fits'
    assert result.estimate.estimated_required_mb is not None
    assert result.estimate.memory_gap_mb is not None
    assert result.architecture_used['num_kv_heads'] == 4
    assert '--max-model-len' in result.copyable_vllm_args


def test_unlikely_large_model_on_small_gpu_recommends_context_reduction():
    result = estimate_compatibility(
        CompatibilityRequest(
            model_id='Meta/Llama-70B',
            architecture='llama',
            parameter_count_b=70,
            max_model_len=32768,
            gpu_memory_total_mb=24576,
            gpu_memory_utilization=0.9,
        )
    )
    assert result.verdict == 'unlikely'
    assert any('context' in rec.title.lower() for rec in result.recommendations)


def test_unknown_without_model_size_or_gpu_memory():
    result = estimate_compatibility(CompatibilityRequest(model_id='custom/model'))
    assert result.verdict == 'unknown'
    assert result.warnings


def test_fp8_cache_reduces_kv_cache_estimate():
    fp16 = estimate_compatibility(
        CompatibilityRequest(
            model_id='Qwen/Qwen3-32B',
            architecture='qwen',
            max_model_len=65536,
            gpu_memory_total_mb=98304,
            cache_dtype='auto',
        )
    )
    fp8 = estimate_compatibility(
        CompatibilityRequest(
            model_id='Qwen/Qwen3-32B',
            architecture='qwen',
            max_model_len=65536,
            gpu_memory_total_mb=98304,
            cache_dtype='fp8',
        )
    )
    assert fp16.estimate.kv_cache_mb is not None
    assert fp8.estimate.kv_cache_mb is not None
    assert fp8.estimate.kv_cache_mb < fp16.estimate.kv_cache_mb


def test_expected_concurrency_increases_kv_cache_estimate():
    single = estimate_compatibility(
        CompatibilityRequest(model_id='Qwen/Qwen3-7B', max_model_len=8192, gpu_memory_total_mb=49152, expected_concurrency=1)
    )
    multi = estimate_compatibility(
        CompatibilityRequest(model_id='Qwen/Qwen3-7B', max_model_len=8192, gpu_memory_total_mb=49152, expected_concurrency=4)
    )
    assert single.estimate.kv_cache_mb is not None
    assert multi.estimate.kv_cache_mb is not None
    assert multi.estimate.kv_cache_mb > single.estimate.kv_cache_mb
