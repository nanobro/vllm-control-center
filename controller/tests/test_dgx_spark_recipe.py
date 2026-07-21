from pathlib import Path

from app.core.command_builder import build_subprocess_argv
from app.core.dgx_spark_recipe import (
    EXPECTED_SAFETENSORS_SHARDS,
    MODEL_ID,
    RECIPE_ENVIRONMENT,
    RECIPE_EXTRA_ARGS,
    _local_checkpoint_issues,
    build_recipe_config,
    model_matches_recipe,
)


def test_recipe_matches_hf_id_and_local_folder():
    assert model_matches_recipe(MODEL_ID)
    assert model_matches_recipe("/models/Qwen3.6-35B-A3B-NVFP4-Fast")
    assert not model_matches_recipe("Qwen/Qwen3-0.6B")


def test_recipe_builds_exact_known_good_config():
    config = build_recipe_config(MODEL_ID)
    assert config.host == "0.0.0.0"
    assert config.max_model_len == 262144
    assert config.kv_cache_memory_bytes == "4294967296"
    assert config.gpu_memory_utilization == 0.85
    argv = build_subprocess_argv(config)
    assert argv[argv.index("--moe-backend") + 1] == "flashinfer_b12x"
    assert "--max-num-batched-tokens" in config.extra_args
    assert RECIPE_EXTRA_ARGS[-1] == '{"method":"mtp","num_speculative_tokens":3}'
    assert RECIPE_EXTRA_ARGS[:2] == ["--moe-backend", "flashinfer_b12x"]
    assert RECIPE_ENVIRONMENT["CUTE_DSL_ARCH"] == "sm_121a"
    assert RECIPE_ENVIRONMENT["VLLM_USE_DEEP_GEMM"] == "0"


def test_incomplete_checkpoint_is_blocked(tmp_path: Path):
    model_dir = tmp_path / "Qwen3.6-35B-A3B-NVFP4-Fast"
    model_dir.mkdir()
    (model_dir / "config.json").write_text("{}")
    (model_dir / "tokenizer_config.json").write_text("{}")
    (model_dir / "model-00001-of-00005.safetensors.incomplete").write_text("")
    issues, details = _local_checkpoint_issues(str(model_dir))
    assert any(".incomplete" in issue for issue in issues)
    assert details["local"] is True


def test_complete_checkpoint_passes_shape_check(tmp_path: Path):
    model_dir = tmp_path / "Qwen3.6-35B-A3B-NVFP4-Fast"
    model_dir.mkdir()
    (model_dir / "config.json").write_text("{}")
    (model_dir / "tokenizer_config.json").write_text("{}")
    for index in range(EXPECTED_SAFETENSORS_SHARDS):
        (model_dir / f"model-{index:05d}.safetensors").write_text("")
    issues, _ = _local_checkpoint_issues(str(model_dir))
    assert issues == []
