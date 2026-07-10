from app.core.log_store import redact_line


def test_redact_secret_line():
    assert redact_line("Authorization: Bearer x") == "<redacted secret line>"
    assert redact_line("--api-key abc") == "<redacted secret line>"
    assert redact_line("normal log") == "normal log"
