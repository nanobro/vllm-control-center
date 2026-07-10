from app.api.playground import _connect_host, _diagnose_quick_test_failure, _endpoint_base_url, _extract_served_model_names, _payload, _stream_error_payload
from app.schemas.instances import VllmServeConfig
from app.schemas.playground import PlaygroundChatRequest


def test_quick_test_connection_refused_gets_plain_english_actions():
    diagnosis = _diagnose_quick_test_failure('All connection attempts failed', status_code=0)
    assert diagnosis['error_type'] == 'endpoint_not_reachable'
    assert 'did not accept' in diagnosis['user_message']
    assert 'Open logs' in diagnosis['next_actions']


def test_quick_test_oom_suggests_low_vram():
    diagnosis = _diagnose_quick_test_failure('CUDA out of memory', status_code=500)
    assert diagnosis['error_type'] == 'insufficient_gpu_memory'
    assert any('Low VRAM' in action for action in diagnosis['next_actions'])


def test_quick_test_model_name_mismatch_is_separate():
    diagnosis = _diagnose_quick_test_failure('The model `foo` does not exist', status_code=400)
    assert diagnosis['error_type'] == 'served_model_name_mismatch'
    assert 'model name' in diagnosis['user_message'].lower()


def test_stream_error_payload_includes_plain_english_guidance():
    payload = _stream_error_payload('CUDA out of memory', status_code=500)
    assert payload['error_type'] == 'insufficient_gpu_memory'
    assert payload['user_message']
    assert any('Low VRAM' in action for action in payload['next_actions'])
    assert payload['status_code'] == 500


def test_extract_served_model_names_from_openai_models_response():
    body = {'data': [{'id': 'Qwen/Qwen3.6-35B-A3B'}, {'id': 'local-alias'}, {'not_id': 'skip'}]}
    assert _extract_served_model_names(body) == ['Qwen/Qwen3.6-35B-A3B', 'local-alias']


def test_model_name_mismatch_detected_from_404_body_too():
    diagnosis = _diagnose_quick_test_failure('model not found: old-name', status_code=404)
    assert diagnosis['error_type'] == 'served_model_name_mismatch'
    assert any('served model name' in action.lower() for action in diagnosis['next_actions'])



def test_payload_model_override_uses_actual_served_name_for_retry():
    req = PlaygroundChatRequest(
        instance_id='i1',
        messages=[{'role': 'user', 'content': 'hello'}],
        model_override='actual-served-name',
    )
    config = VllmServeConfig(model='configured-model', served_model_name='configured-alias')
    payload = _payload(req, config, stream=False)
    assert payload['model'] == 'actual-served-name'


def test_payload_falls_back_to_configured_served_name_without_override():
    req = PlaygroundChatRequest(instance_id='i1', messages=[{'role': 'user', 'content': 'hello'}])
    config = VllmServeConfig(model='configured-model', served_model_name='configured-alias')
    payload = _payload(req, config, stream=True)
    assert payload['model'] == 'configured-alias'
    assert payload['stream'] is True



def test_playground_normalizes_wildcard_host_for_backend_connection():
    assert _connect_host('0.0.0.0') == '127.0.0.1'
    assert _connect_host('::') == '127.0.0.1'
    assert _connect_host('') == '127.0.0.1'
    assert _connect_host('192.168.1.50') == '192.168.1.50'


def test_playground_endpoint_base_uses_localhost_for_wildcard_bind_host():
    config = VllmServeConfig(model='configured-model', host='0.0.0.0', port=9123)
    assert _endpoint_base_url(config) == 'http://127.0.0.1:9123'
