from app.core.command_builder import build_subprocess_argv, redact_argv, shell_join
from app.schemas.instances import VllmServeConfig


def base_url(config: VllmServeConfig) -> str:
    host = 'localhost' if config.host in {'0.0.0.0', '127.0.0.1'} else config.host
    return f"http://{host}:{config.port}/v1"


def curl_chat_snippet(config: VllmServeConfig, redact: bool = True) -> str:
    key = '<redacted>' if redact and config.api_key else (config.api_key or 'EMPTY')
    model = config.served_model_name or config.model
    return f'''curl {base_url(config)}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {key}" \\
  -d '{{"model":"{model}","messages":[{{"role":"user","content":"Say hello from vLLM"}}],"temperature":0.7}}' '''


def python_openai_snippet(config: VllmServeConfig, redact: bool = True) -> str:
    key = '<redacted>' if redact and config.api_key else (config.api_key or 'EMPTY')
    model = config.served_model_name or config.model
    return f'''from openai import OpenAI

client = OpenAI(base_url="{base_url(config)}", api_key="{key}")

response = client.chat.completions.create(
    model="{model}",
    messages=[{{"role": "user", "content": "Say hello from vLLM"}}],
    temperature=0.7,
)
print(response.choices[0].message.content)
'''


def typescript_openai_snippet(config: VllmServeConfig, redact: bool = True) -> str:
    key = '<redacted>' if redact and config.api_key else (config.api_key or 'EMPTY')
    model = config.served_model_name or config.model
    return f'''import OpenAI from "openai";

const client = new OpenAI({{
  baseURL: "{base_url(config)}",
  apiKey: "{key}",
}});

const response = await client.chat.completions.create({{
  model: "{model}",
  messages: [{{ role: "user", content: "Say hello from vLLM" }}],
  temperature: 0.7,
}});

console.log(response.choices[0].message.content);
'''


def openwebui_notes(config: VllmServeConfig, redact: bool = True) -> str:
    key = '<redacted>' if redact and config.api_key else (config.api_key or 'EMPTY')
    return f'''Open WebUI connection

OpenAI API Base URL:
{base_url(config)}

API Key:
{key}

Model name:
{config.served_model_name or config.model}
'''


def command_line(config: VllmServeConfig, redact: bool = True) -> str:
    argv = build_subprocess_argv(config)
    if redact:
        argv = redact_argv(argv)
    return shell_join(argv)
