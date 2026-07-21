import importlib.util
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "dgx-spark-hardware-qa.py"
SPEC = importlib.util.spec_from_file_location("dgx_spark_hardware_qa", SCRIPT)
assert SPEC and SPEC.loader
QA = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(QA)


def _executable(path: Path, content: str = "#!/bin/sh\n") -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    path.chmod(0o755)
    return path


def test_resolve_vllm_python_prefers_explicit_override(tmp_path: Path):
    override = _executable(tmp_path / "runtime-python")
    assert QA.resolve_vllm_python("vllm", override=str(override)) == str(override)


def test_resolve_vllm_python_uses_sibling_interpreter(tmp_path: Path):
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    vllm = _executable(bin_dir / "vllm")
    python = _executable(bin_dir / "python")
    assert QA.resolve_vllm_python(str(vllm), fallback="fallback-python") == str(python)


def test_resolve_vllm_python_reads_cli_shebang(tmp_path: Path):
    interpreter = _executable(tmp_path / "runtime-python")
    vllm = _executable(tmp_path / "tools" / "vllm", f"#!{interpreter}\n")
    assert QA.resolve_vllm_python(str(vllm), fallback="fallback-python") == str(interpreter)


def test_capture_runtime_logs_writes_artifact(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(QA, "OUT", tmp_path)
    monkeypatch.setattr(
        QA,
        "api",
        lambda *args, **kwargs: [
            {"created_at": "2026-07-21T00:00:00Z", "stream": "stderr", "line": "runtime failure"}
        ],
    )
    report = {}
    QA.capture_runtime_logs("instance-1", report)
    assert report["runtime_evidence"] == {"file": "runtime.log", "line_count": 1}
    assert "[stderr] runtime failure" in (tmp_path / "runtime.log").read_text(encoding="utf-8")