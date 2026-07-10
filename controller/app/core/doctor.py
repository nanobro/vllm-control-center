import asyncio
import os
import shutil
import sys
from dataclasses import dataclass

from app.schemas.system import CheckResult, DoctorReport
from app.core.gpu import get_nvidia_gpus


@dataclass
class CommandResult:
    returncode: int
    stdout: str
    stderr: str


async def run_command(argv: list[str], timeout: float = 5.0) -> CommandResult:
    try:
        proc = await asyncio.create_subprocess_exec(
            *argv,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        return CommandResult(proc.returncode or 0, stdout.decode(errors="replace"), stderr.decode(errors="replace"))
    except FileNotFoundError:
        return CommandResult(127, "", f"Command not found: {argv[0]}")
    except TimeoutError:
        return CommandResult(124, "", f"Command timed out: {argv[0]}")


async def check_vllm() -> CheckResult:
    if not shutil.which("vllm"):
        return CheckResult(ok=False, message="vLLM CLI not found. Install vLLM first.")
    result = await run_command(["vllm", "--version"])
    text = (result.stdout or result.stderr).strip()
    return CheckResult(ok=result.returncode == 0, message=text or "vLLM found", version=text or None)


async def check_docker() -> CheckResult:
    if not shutil.which("docker"):
        return CheckResult(ok=False, message="Docker not found.")
    result = await run_command(["docker", "--version"])
    text = (result.stdout or result.stderr).strip()
    return CheckResult(ok=result.returncode == 0, message=text or "Docker found", version=text or None)


def check_hf_token() -> CheckResult:
    for name in ("HF_TOKEN", "HUGGING_FACE_HUB_TOKEN"):
        value = os.environ.get(name)
        if value:
            return CheckResult(
                ok=True,
                message=f"Hugging Face token available through {name}.",
                details={"env_var": name, "configured": True},
            )
    return CheckResult(
        ok=False,
        message="Hugging Face token not set. Public models still work; gated/private downloads need HF_TOKEN.",
        details={"env_var": "HF_TOKEN", "configured": False, "optional": True},
    )


async def run_doctor() -> DoctorReport:
    gpus = await get_nvidia_gpus()
    vllm = await check_vllm()
    docker = await check_docker()
    hf_token = check_hf_token()
    warnings: list[str] = []
    if not gpus:
        warnings.append("No NVIDIA GPU detected. MVP is CUDA-first; CPU/other backends are not implemented yet.")
    if not vllm.ok:
        warnings.append("vLLM is not available. You can still create configs and exports.")

    return DoctorReport(
        python=CheckResult(ok=True, message=sys.version.split()[0], version=sys.version.split()[0]),
        vllm=vllm,
        nvidia=CheckResult(ok=bool(gpus), message=f"{len(gpus)} NVIDIA GPU(s) detected" if gpus else "No NVIDIA GPU detected"),
        docker=docker,
        hf_token=hf_token,
        gpus=gpus,
        warnings=warnings,
    )
