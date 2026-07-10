import pytest

from app.core.command_builder import build_subprocess_argv, build_yaml_config, redact_argv, shell_join
from app.schemas.instances import VllmServeConfig


def test_build_subprocess_argv_basic():
    cfg = VllmServeConfig(model="Qwen/Qwen3-0.6B", port=8001, api_key="secret")
    argv = build_subprocess_argv(cfg)
    assert argv[:3] == ["vllm", "serve", "Qwen/Qwen3-0.6B"]
    assert "--port" in argv
    assert "8001" in argv
    assert "--api-key" in argv


def test_redact_argv():
    cfg = VllmServeConfig(model="Qwen/Qwen3-0.6B", api_key="secret")
    redacted = redact_argv(build_subprocess_argv(cfg))
    assert "secret" not in redacted
    assert "<redacted>" in redacted


def test_yaml_redacts_secret():
    cfg = VllmServeConfig(model="Qwen/Qwen3-0.6B", api_key="secret")
    text = build_yaml_config(cfg)
    assert "secret" not in text
    assert "<redacted>" in text


def test_invalid_gpu_memory_utilization():
    with pytest.raises(ValueError):
        VllmServeConfig(model="x", gpu_memory_utilization=1.2)


def test_rejects_shell_tokens_in_extra_args():
    with pytest.raises(ValueError):
        VllmServeConfig(model="x", extra_args=["--foo", "bar; rm -rf /"])


def test_shell_join_quotes():
    assert shell_join(["hello", "a b"]) == "hello 'a b'"
