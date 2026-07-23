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
    recipe_summary,
)


def test_recipe_matches_hf_id_and_local_folder():
    assert model_matches_recipe(MODEL_ID)
    assert model_matches_recipe("/models/Qwen3.6-35B-A3B-NVFP4-Fast")
    assert not model_matches_recipe("Qwen/Qwen3-0.6B")


def test_recipe_builds_exact_experimental_config():
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


def test_recipe_summary_reports_required_runtime_without_claiming_hardware_pass():
    summary = recipe_summary()
    assert "Unvalidated candidate" in summary["verified_runtime"]
    assert "no successful chat completion" in summary["verified_runtime"]
    assert "Experimental" in summary["name"]
    assert "Known-good" not in summary["note"]


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


def test_incomplete_hf_cache_for_repo_id_is_blocked(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("HUGGINGFACE_HUB_CACHE", str(tmp_path))
    repo = tmp_path / "models--unsloth--Qwen3.6-35B-A3B-NVFP4-Fast"
    snapshot = repo / "snapshots" / "revision"
    snapshot.mkdir(parents=True)
    (repo / "refs").mkdir()
    (repo / "refs" / "main").write_text("revision")
    (snapshot / "config.json").write_text("{}")
    (snapshot / "tokenizer_config.json").write_text("{}")
    (snapshot / "model-00003-of-00005.safetensors").write_text("")

    issues, details = _local_checkpoint_issues(MODEL_ID)

    assert any("Expected at least 5 safetensors shards" in issue for issue in issues)
    assert details["local"] is True
    assert details["source"] == "hf-cache"
