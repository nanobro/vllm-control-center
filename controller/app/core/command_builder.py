import shlex
from typing import Any

import yaml

from app.schemas.instances import VllmServeConfig

SECRET_FLAGS = {"--api-key"}


def build_subprocess_argv(config: VllmServeConfig) -> list[str]:
    argv = ["vllm", "serve", config.model]
    add = argv.extend

    add(["--host", config.host])
    add(["--port", str(config.port)])
    add(["--dtype", config.dtype])
    add(["--gpu-memory-utilization", str(config.gpu_memory_utilization)])

    optional_pairs: list[tuple[str, Any]] = [
        ("--api-key", config.api_key),
        ("--served-model-name", config.served_model_name),
        ("--max-model-len", config.max_model_len),
        ("--kv-cache-memory-bytes", config.kv_cache_memory_bytes),
        ("--tensor-parallel-size", config.tensor_parallel_size),
        ("--pipeline-parallel-size", config.pipeline_parallel_size),
        ("--data-parallel-size", config.data_parallel_size),
        ("--tool-call-parser", config.tool_call_parser),
        ("--reasoning-parser", config.reasoning_parser),
    ]
    for flag, value in optional_pairs:
        if value is not None:
            add([flag, str(value)])

    if config.device_ids:
        add(["--device-ids", ",".join(str(x) for x in config.device_ids)])
    if config.trust_remote_code:
        argv.append("--trust-remote-code")
    if config.enable_auto_tool_choice:
        argv.append("--enable-auto-tool-choice")
    if config.extra_args:
        argv.extend(config.extra_args)
    return argv


def redact_argv(argv: list[str]) -> list[str]:
    redacted = list(argv)
    for idx, token in enumerate(redacted[:-1]):
        if token in SECRET_FLAGS:
            redacted[idx + 1] = "<redacted>"
    return redacted


def shell_join(argv: list[str]) -> str:
    return " ".join(shlex.quote(x) for x in argv)


def build_yaml_config(config: VllmServeConfig, redact: bool = True) -> str:
    data = config.model_dump(exclude_none=True)
    if redact and data.get("api_key"):
        data["api_key"] = "<redacted>"
    return yaml.safe_dump(data, sort_keys=False)


def build_docker_command(config: VllmServeConfig) -> list[str]:
    inner = build_subprocess_argv(config)[2:]
    return [
        "docker",
        "run",
        "--runtime",
        "nvidia",
        "--gpus",
        "all",
        "-v",
        "~/.cache/huggingface:/root/.cache/huggingface",
        "--env",
        "HF_TOKEN=$HF_TOKEN",
        "-p",
        f"{config.port}:{config.port}",
        "--ipc=host",
        "vllm/vllm-openai:latest",
        *inner,
    ]


def build_docker_compose(config: VllmServeConfig) -> str:
    inner = build_subprocess_argv(config)[2:]
    data = {
        "services": {
            "vllm": {
                "image": "vllm/vllm-openai:latest",
                "ports": [f"{config.port}:{config.port}"],
                "ipc": "host",
                "environment": {"HF_TOKEN": "${HF_TOKEN}"},
                "volumes": ["~/.cache/huggingface:/root/.cache/huggingface"],
                "command": inner,
            }
        }
    }
    return yaml.safe_dump(data, sort_keys=False)
