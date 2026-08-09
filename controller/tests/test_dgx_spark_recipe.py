from pathlib import Path

import pytest

from app.core.command_builder import build_subprocess_argv
from app.core.dgx_spark_recipe import (
    MODEL_ID,
    RECIPE_ENVIRONMENT,
    RECIPE_EXTRA_ARGS,
    _local_checkpoint_issues,
    build_recipe_config,
    model_matches_recipe,
    recipe_summary,
)


def test_recipe_matches_canonical_hf_id_and_local_folder():
    assert model_matches_recipe(MODEL_ID)
    assert model_matches_recipe("/models/Qwen3.6-35B-A3B-NVFP4")
    assert not model_matches_recipe("unsloth/Qwen3.6-35B-A3B-NVFP4-Fast")
    assert not model_matches_recipe("Qwen/Qwen3-0.6B")


def test_recipe_builds_canonical_runtime_config():
    config = build_recipe_config(MODEL_ID)
    assert config.host == "0.0.0.0"
    assert config.max_model_len == 262144
    assert config.gpu_memory_utilization == 0.40
    assert config.reasoning_parser == "qwen3"
    assert config.enable_auto_tool_choice is True
    assert config.tool_call_parser == "qwen3_xml"
    argv = build_subprocess_argv(config)
    assert argv[argv.index("--gpu-memory-utilization") + 1] == "0.4"
    assert argv[argv.index("--max-model-len") + 1] == "262144"
    assert argv[argv.index("--reasoning-parser") + 1] == "qwen3"
    assert argv[argv.index("--tool-call-parser") + 1] == "qwen3_xml"
    assert "--enable-auto-tool-choice" in argv
    assert RECIPE_EXTRA_ARGS[-1] == '{"method":"mtp","num_speculative_tokens":3}'
    assert RECIPE_ENVIRONMENT["CUTE_DSL_ARCH"] == "sm_121a"


def test_recipe_summary_reports_canonical_runtime():
    summary = recipe_summary()
    assert summary["model_id"] == MODEL_ID
    assert summary["serve"]["gpu_memory_utilization"] == 0.40
    assert summary["serve"]["max_model_len"] == 262144
    assert summary["serve"]["reasoning_parser"] == "qwen3"
    assert summary["serve"]["enable_auto_tool_choice"] is True
    assert summary["serve"]["tool_call_parser"] == "qwen3_xml"
    assert summary["serve"]["speculative_config"]["num_speculative_tokens"] == 3
    assert "Fast" not in summary["model_id"]


def _make_indexed_checkpoint(tmp_path: Path, names: list[str]) -> Path:
    model_dir = tmp_path / "checkpoint"
    model_dir.mkdir()
    (model_dir / "config.json").write_text("{}")
    (model_dir / "tokenizer_config.json").write_text("{}")
    (model_dir / "model.safetensors.index.json").write_text(
        __import__("json").dumps({"weight_map": {f"layer_{i}": name for i, name in enumerate(names)}})
    )
    for name in names:
        (model_dir / name).write_text("")
    return model_dir


def test_complete_checkpoint_uses_index_evidence(tmp_path: Path):
    model_dir = _make_indexed_checkpoint(tmp_path, ["a.safetensors", "b.safetensors", "c.safetensors"])
    issues, details = _local_checkpoint_issues(str(model_dir))
    assert issues == []
    assert details["indexed_shards"] == ["a.safetensors", "b.safetensors", "c.safetensors"]
    assert details["missing_indexed_shards"] == []


def test_missing_indexed_shard_is_blocked(tmp_path: Path):
    model_dir = _make_indexed_checkpoint(tmp_path, ["a.safetensors", "b.safetensors"])
    (model_dir / "b.safetensors").unlink()
    issues, details = _local_checkpoint_issues(str(model_dir))
    assert any("missing weight shards" in issue for issue in issues)
    assert details["missing_indexed_shards"] == ["b.safetensors"]


def test_incomplete_hf_cache_for_repo_id_is_blocked(tmp_path, monkeypatch):
    monkeypatch.setenv("HUGGINGFACE_HUB_CACHE", str(tmp_path))
    repo = tmp_path / "models--unsloth--Qwen3.6-35B-A3B-NVFP4"
    snapshot = repo / "snapshots" / "revision"
    snapshot.mkdir(parents=True)
    (repo / "refs").mkdir()
    (repo / "refs" / "main").write_text("revision")
    (snapshot / "config.json").write_text("{}")
    (snapshot / "tokenizer_config.json").write_text("{}")
    (snapshot / "model.safetensors.index.json").write_text(
        '{"weight_map":{"a":"model-00001-of-00002.safetensors","b":"model-00002-of-00002.safetensors"}}'
    )
    (snapshot / "model-00001-of-00002.safetensors").write_text("")

    issues, details = _local_checkpoint_issues(MODEL_ID)

    assert any("missing weight shards" in issue for issue in issues)
    assert details["local"] is True
    assert details["source"] == "hf-cache"


@pytest.mark.asyncio
async def test_external_runtime_is_reported_read_only(monkeypatch):
    from app.core import dgx_spark_recipe as recipe

    async def fake_output(*argv, **kwargs):
        return "external evidence"

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return None

        def read(self):
            return ('{"data":[{"id":"%s"}]}' % MODEL_ID).encode()

    monkeypatch.setattr(recipe, "_command_output", fake_output)
    monkeypatch.setattr(recipe.urlrequest, "urlopen", lambda *args, **kwargs: Response())
    evidence = await recipe._runtime_evidence(MODEL_ID)
    assert evidence["status"] == "external"
    assert evidence["matching_model"] == MODEL_ID
    assert evidence["process_evidence"] == "external evidence"


@pytest.mark.asyncio
async def test_duplicate_load_is_rejected_for_external_runtime(monkeypatch):
    from app.core import dgx_spark_recipe as recipe

    inspection = recipe.RecipeInspection(
        ready=True,
        blockers=[],
        warnings=[],
        details={"runtime": {"status": "external", "matching_model": MODEL_ID}},
    )
    monkeypatch.setattr(recipe, "inspect_recipe", lambda _model: _completed(inspection))

    with pytest.raises(RuntimeError, match="already running in an external process"):
        await recipe.load_recipe_model(MODEL_ID)


async def _completed(value):
    return value


@pytest.mark.asyncio
async def test_eject_fails_closed_without_controller_owned_process(monkeypatch):
    from app.core import dgx_spark_recipe as recipe

    monkeypatch.setattr(recipe, "fetchone", lambda *args: _completed({"id": "external", "pid": 1234}))
    recipe.process_manager._processes.clear()

    with pytest.raises(ValueError, match="not owned by Control Center"):
        await recipe.eject_recipe_instance("external", delete_record=False)
