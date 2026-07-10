from app.core.metrics_parser import metric_sum, parse_prometheus_text


def test_parse_prometheus_text_with_labels():
    text = '''
# HELP vllm:num_requests_running Number of running requests
# TYPE vllm:num_requests_running gauge
vllm:num_requests_running{model_name="Qwen/Qwen3-0.6B"} 2
vllm:num_requests_waiting{model_name="Qwen/Qwen3-0.6B"} 1
vllm:kv_cache_usage_perc{model_name="Qwen/Qwen3-0.6B"} 42.5
'''
    samples = parse_prometheus_text(text)
    assert len(samples) == 3
    assert samples[0].name == 'vllm:num_requests_running'
    assert samples[0].labels['model_name'] == 'Qwen/Qwen3-0.6B'
    assert metric_sum(samples, 'vllm:num_requests_running') == 2
    assert metric_sum(samples, 'vllm:kv_cache_usage_perc') == 42.5


def test_metric_sum_returns_none_for_missing():
    assert metric_sum([], 'missing') is None
