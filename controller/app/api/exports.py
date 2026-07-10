from fastapi import APIRouter, HTTPException, Query

from app.core.command_builder import build_docker_command, build_docker_compose, build_yaml_config, redact_argv, shell_join
from app.core.export_helpers import curl_chat_snippet, openwebui_notes, python_openai_snippet, typescript_openai_snippet
from app.db import fetchone, loads_json
from app.schemas.instances import VllmServeConfig

router = APIRouter(tags=['exports'])


@router.get('/{instance_id}')
async def export_instance(instance_id: str, redact: bool = Query(default=True)):
    row = await fetchone('SELECT * FROM instances WHERE id = ?', (instance_id,))
    if not row:
        raise HTTPException(status_code=404, detail='instance not found')
    config = VllmServeConfig(**loads_json(row['config_json']))
    docker = build_docker_command(config)
    if redact:
        docker = redact_argv(docker)
    return {
        'yaml_config': build_yaml_config(config, redact=redact),
        'docker_command': shell_join(docker),
        'docker_compose': build_docker_compose(config),
        'curl_chat': curl_chat_snippet(config, redact=redact),
        'python_openai': python_openai_snippet(config, redact=redact),
        'typescript_openai': typescript_openai_snippet(config, redact=redact),
        'openwebui': openwebui_notes(config, redact=redact),
    }
