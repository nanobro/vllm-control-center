from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "vLLM Control Center"
    database_path: Path = Path.home() / ".vllm-control-center" / "controller.db"
    default_bind_host: str = "127.0.0.1"
    controller_api_key: str | None = None
    allow_localhost_auth_bypass: bool = False
    secret_backend: str = "sqlite"
    secret_service_name: str = "vllm-control-center"
    allow_remote_forwarding: bool = False

    model_config = SettingsConfigDict(env_prefix="VCC_", env_file=".env")


settings = Settings()
