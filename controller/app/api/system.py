from fastapi import APIRouter

from app.core.doctor import run_doctor
from app.core.ports import is_port_available

router = APIRouter(tags=["system"])


@router.get("/doctor")
async def doctor():
    return await run_doctor()


@router.get("/ports/{port}")
async def check_port(port: int):
    return {"port": port, "available": is_port_available("127.0.0.1", port)}
