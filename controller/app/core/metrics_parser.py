from app.schemas.metrics import MetricSample


def parse_prometheus_text(text: str) -> list[MetricSample]:
    """Parse the simple Prometheus text exposition format used by vLLM.

    This intentionally ignores HELP/TYPE/comments and supports labels like:
    vllm:num_requests_running{model_name="qwen"} 1
    """
    samples: list[MetricSample] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split()
        if len(parts) < 2:
            continue
        left, value_text = parts[0], parts[1]
        try:
            value = float(value_text)
        except ValueError:
            continue
        name, labels = _parse_name_and_labels(left)
        samples.append(MetricSample(name=name, labels=labels, value=value))
    return samples


def _parse_name_and_labels(left: str) -> tuple[str, dict[str, str]]:
    if '{' not in left or not left.endswith('}'):
        return left, {}
    name, label_text = left.split('{', 1)
    label_text = label_text[:-1]
    labels: dict[str, str] = {}
    for item in _split_labels(label_text):
        if '=' not in item:
            continue
        key, value = item.split('=', 1)
        labels[key.strip()] = value.strip().strip('"')
    return name, labels


def _split_labels(label_text: str) -> list[str]:
    out: list[str] = []
    buf: list[str] = []
    in_quotes = False
    escaped = False
    for ch in label_text:
        if escaped:
            buf.append(ch)
            escaped = False
            continue
        if ch == '\\':
            buf.append(ch)
            escaped = True
            continue
        if ch == '"':
            in_quotes = not in_quotes
            buf.append(ch)
            continue
        if ch == ',' and not in_quotes:
            out.append(''.join(buf))
            buf = []
            continue
        buf.append(ch)
    if buf:
        out.append(''.join(buf))
    return out


def metric_sum(samples: list[MetricSample], name: str) -> float | None:
    values = [sample.value for sample in samples if sample.name == name]
    if not values:
        return None
    return float(sum(values))
