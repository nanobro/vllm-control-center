#!/usr/bin/env python3
"""Exercise v0.79 Load -> warm-up -> /v1 test -> Eject on a real DGX Spark."""

from __future__ import annotations

import json
import os
import pathlib
import platform
import shlex
import shutil
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[1]
STAMP = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
OUT = ROOT / "artifacts" / "hardware-qa" / f"dgx-spark-v079-{STAMP}"
CONTROLLER_PORT = int(os.environ.get("VCC_QA_CONTROLLER_PORT", "18787"))
MODEL_PORT = int(os.environ.get("VCC_QA_MODEL_PORT", "18000"))
MODEL = os.environ.get("VCC_DGX_MODEL", "unsloth/Qwen3.6-35B-A3B-NVFP4-Fast")
PYTHON = os.environ.get("VCC_PYTHON", sys.executable)
VLLM_BIN = os.environ.get("VCC_VLLM_BIN") or shutil.which("vllm") or "vllm"
VLLM_PYTHON_OVERRIDE = os.environ.get("VCC_VLLM_PYTHON")
BASE = f"http://127.0.0.1:{CONTROLLER_PORT}"


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def redact(text: str) -> str:
    return text.replace(str(pathlib.Path.home()), "~")


def run(*argv: str, timeout: int = 30) -> dict[str, Any]:
    try:
        result = subprocess.run(
            argv,
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=timeout,
            check=False,
        )
        return {"argv": list(argv), "returncode": result.returncode, "output": redact(result.stdout.strip())}
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {"argv": list(argv), "returncode": None, "output": redact(str(exc))}


def resolve_vllm_python(vllm_bin: str, *, override: str | None = None, fallback: str = PYTHON) -> str:
    """Resolve the Python interpreter that owns the selected vLLM CLI."""
    if override:
        return str(pathlib.Path(override).expanduser())
    resolved = pathlib.Path(shutil.which(vllm_bin) or vllm_bin).expanduser()
    for name in ("python", "python3"):
        candidate = resolved.parent / name
        if candidate.is_file() and os.access(candidate, os.X_OK):
            return str(candidate)
    try:
        first_line = resolved.read_text(encoding="utf-8", errors="ignore").splitlines()[0]
    except (OSError, IndexError):
        return fallback
    if first_line.startswith("#!"):
        parts = shlex.split(first_line[2:].strip())
        if parts:
            interpreter = pathlib.Path(parts[0]).expanduser()
            if interpreter.name == "env" and len(parts) > 1:
                discovered = shutil.which(parts[1])
                if discovered:
                    return discovered
            if interpreter.is_file() and os.access(interpreter, os.X_OK):
                return str(interpreter)
    return fallback


def api(path: str, *, method: str = "GET", body: dict[str, Any] | None = None, timeout: int = 30) -> Any:
    request = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"content-type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310
        return json.loads(response.read().decode())


def port_open(port: int) -> bool:
    with socket.socket() as sock:
        sock.settimeout(1)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def wait_controller() -> None:
    deadline = time.monotonic() + 90
    while time.monotonic() < deadline:
        try:
            api("/api/health", timeout=3)
            return
        except (OSError, urllib.error.URLError, json.JSONDecodeError):
            time.sleep(1)
    raise RuntimeError("Controller did not become healthy.")


def test_v1() -> dict[str, Any]:
    body = {
        "model": "unsloth/Qwen3.6-35B-A3B-NVFP4-Fast",
        "messages": [{"role": "user", "content": "Reply with exactly: ready"}],
        "max_tokens": 16,
        "temperature": 0,
        "chat_template_kwargs": {"enable_thinking": False},
    }
    request = urllib.request.Request(
        f"http://127.0.0.1:{MODEL_PORT}/v1/chat/completions",
        data=json.dumps(body).encode(),
        method="POST",
        headers={"content-type": "application/json"},
    )
    started = time.perf_counter()
    with urllib.request.urlopen(request, timeout=180) as response:  # noqa: S310
        payload = json.loads(response.read().decode())
    return {"latency_ms": round((time.perf_counter() - started) * 1000), "response": payload}


def capture_runtime_logs(instance_id: str, report: dict[str, Any]) -> None:
    """Persist controller-owned runtime logs before Eject deletes transient rows."""
    try:
        entries = api(f"/api/instances/{instance_id}/logs?tail=5000", timeout=30)
        lines = [
            f"[{item.get('created_at', 'unknown')}] [{item.get('stream', 'unknown')}] {item.get('line', '')}"
            for item in entries
        ]
        (OUT / "runtime.log").write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
        report["runtime_evidence"] = {"file": "runtime.log", "line_count": len(lines)}
    except Exception as exc:  # noqa: BLE001 - evidence capture must not bypass cleanup.
        report["runtime_evidence"] = {"file": "runtime.log", "error": redact(repr(exc))}


def save(report: dict[str, Any]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    lines = [
        "# DGX Spark v0.79 Hardware QA",
        "",
        f"- Result: **{report.get('result', 'UNKNOWN')}**",
        f"- Model: `{redact(MODEL)}`",
        f"- Started: {report['started_at']}",
        f"- Finished: {report.get('finished_at', 'n/a')}",
        "",
        "## Checks",
        "",
    ]
    lines += [f"- **{key}:** `{value}`" for key, value in report.get("checks", {}).items()]
    if report.get("error"):
        lines += ["", "## Error", "", f"```text\n{redact(str(report['error']))}\n```"]
    (OUT / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    log = (OUT / "controller.log").open("w", encoding="utf-8")
    resolved_vllm_bin = shutil.which(VLLM_BIN) or str(pathlib.Path(VLLM_BIN).expanduser())
    vllm_python = resolve_vllm_python(
        resolved_vllm_bin,
        override=VLLM_PYTHON_OVERRIDE,
    )
    report: dict[str, Any] = {
        "schema": 1,
        "started_at": now(),
        "model": redact(MODEL),
        "checks": {},
        "system": {
            "platform": platform.platform(),
            "machine": platform.machine(),
            "vllm_binary": redact(resolved_vllm_bin),
            "vllm_python": redact(vllm_python),
            "vllm": run(resolved_vllm_bin, "--version"),
            "torch": run(vllm_python, "-c", "import torch; print(torch.__version__); print(torch.version.cuda)"),
            "nvidia_smi": run("nvidia-smi"),
            "memory_before": run("free", "-g"),
        },
    }
    controller: subprocess.Popen[str] | None = None
    instance_id: str | None = None
    try:
        env = os.environ.copy()
        env["VCC_DATABASE_PATH"] = str(OUT / "controller.db")
        env["PATH"] = str(pathlib.Path(resolved_vllm_bin).parent) + os.pathsep + env.get("PATH", "")
        controller = subprocess.Popen(
            [PYTHON, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(CONTROLLER_PORT)],
            cwd=ROOT / "controller",
            env=env,
            text=True,
            stdout=log,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
        wait_controller()
        report["checks"]["controller_health"] = "PASS"

        encoded_model = urllib.parse.quote(MODEL, safe="")
        inspection = api(f"/api/runtime-recipes/qwen36-dgx-spark?model={encoded_model}")
        report["inspection"] = inspection
        blockers = inspection["inspection"]["blockers"]
        if blockers:
            raise RuntimeError("Recipe preflight blocked: " + "; ".join(blockers))
        report["checks"]["recipe_preflight"] = "PASS"

        loaded = api(
            "/api/runtime-recipes/qwen36-dgx-spark/load",
            method="POST",
            body={"model": MODEL, "port": MODEL_PORT},
            timeout=60,
        )
        instance_id = loaded["instance"]["id"]
        report["load_response"] = loaded

        deadline = time.monotonic() + 900
        final_status = "starting"
        while time.monotonic() < deadline:
            status = api(f"/api/runtime-recipes/qwen36-dgx-spark?model={encoded_model}", timeout=15)
            report["last_status"] = status
            final_status = (status.get("instance") or {}).get("status", "missing")
            if final_status in {"running", "crashed", "stopped"}:
                break
            time.sleep(5)
        if final_status != "running":
            capture_runtime_logs(instance_id, report)
            last_error = ((report.get("last_status") or {}).get("instance") or {}).get("last_error")
            detail = f"; last_error={last_error}" if last_error else ""
            raise RuntimeError(f"Model did not reach running state; final status={final_status}{detail}")
        report["checks"]["load_and_three_warmups"] = "PASS"

        report["openai_test"] = test_v1()
        report["checks"]["openai_v1_test"] = "PASS"

        capture_runtime_logs(instance_id, report)
        api(f"/api/runtime-recipes/qwen36-dgx-spark/{instance_id}/eject", method="POST", timeout=60)
        instance_id = None
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline and port_open(MODEL_PORT):
            time.sleep(1)
        if port_open(MODEL_PORT):
            raise RuntimeError("Eject returned but the model port is still open.")
        report["checks"]["eject_and_port_release"] = "PASS"
        report["system"]["memory_after"] = run("free", "-g")
        report["result"] = "PASS"
        return 0
    except Exception as exc:  # noqa: BLE001
        report["error"] = repr(exc)
        report["result"] = "FAIL"
        return 1
    finally:
        if instance_id:
            try:
                capture_runtime_logs(instance_id, report)
                api(f"/api/runtime-recipes/qwen36-dgx-spark/{instance_id}/eject", method="POST", timeout=30)
            except Exception:
                pass
        if controller and controller.poll() is None:
            try:
                os.killpg(controller.pid, signal.SIGTERM)
                controller.wait(timeout=15)
            except (ProcessLookupError, subprocess.TimeoutExpired):
                try:
                    os.killpg(controller.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
        log.close()
        report["finished_at"] = now()
        save(report)
        print(OUT)


if __name__ == "__main__":
    raise SystemExit(main())
