import asyncio
import shutil

from app.schemas.system import GpuInfo


async def get_nvidia_gpus() -> list[GpuInfo]:
    if not shutil.which("nvidia-smi"):
        return []
    query = "index,name,memory.total,memory.used,utilization.gpu,temperature.gpu"
    try:
        proc = await asyncio.create_subprocess_exec(
            "nvidia-smi",
            f"--query-gpu={query}",
            "--format=csv,noheader,nounits",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
        if proc.returncode != 0:
            return []
        gpus: list[GpuInfo] = []
        for line in stdout.decode(errors="replace").splitlines():
            parts = [p.strip() for p in line.split(",")]
            if len(parts) != 6:
                continue
            gpus.append(
                GpuInfo(
                    index=int(parts[0]),
                    name=parts[1],
                    memory_total_mb=_to_int(parts[2]),
                    memory_used_mb=_to_int(parts[3]),
                    utilization_percent=_to_int(parts[4]),
                    temperature_c=_to_int(parts[5]),
                )
            )
        return gpus
    except Exception:
        return []


def _to_int(value: str) -> int | None:
    try:
        return int(value)
    except ValueError:
        return None
