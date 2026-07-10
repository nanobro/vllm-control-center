from app.core.export_helpers import curl_chat_snippet, python_openai_snippet, typescript_openai_snippet
from app.schemas.instances import VllmServeConfig


def test_export_snippets_redact_api_key():
    config = VllmServeConfig(model='Qwen/Qwen3-0.6B', api_key='secret-key')
    assert 'secret-key' not in curl_chat_snippet(config)
    assert '<redacted>' in python_openai_snippet(config)
    assert '<redacted>' in typescript_openai_snippet(config)
