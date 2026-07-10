from pathlib import Path

from app.core.process_manager import diagnose_model_reference_before_start
from app.schemas.instances import VllmServeConfig


def test_qwen36_remote_model_is_not_blocked_by_size_or_name():
    config = VllmServeConfig(model='Qwen/Qwen3.6-235B-A22B-Instruct')
    assert diagnose_model_reference_before_start(config) is None


def test_hf_cache_parent_points_to_snapshot(tmp_path: Path):
    root = tmp_path / 'models--Qwen--Qwen3.6-14B'
    (root / 'snapshots' / 'abc123').mkdir(parents=True)
    config = VllmServeConfig(model=str(root))
    reason = diagnose_model_reference_before_start(config)
    assert reason is not None
    assert 'snapshot' in reason.lower()


def test_missing_tokenizer_is_detected_for_local_folder(tmp_path: Path):
    root = tmp_path / 'model'
    root.mkdir()
    (root / 'config.json').write_text('{"model_type":"qwen3"}', encoding='utf-8')
    (root / 'model.safetensors').write_text('fake', encoding='utf-8')
    reason = diagnose_model_reference_before_start(VllmServeConfig(model=str(root)))
    assert reason is not None
    assert 'tokenizer' in reason.lower()


def test_non_text_local_model_is_detected(tmp_path: Path):
    root = tmp_path / 'image-model'
    root.mkdir()
    (root / 'config.json').write_text('{"model_type":"stable-diffusion", "architectures":["UNet2DConditionModel"]}', encoding='utf-8')
    (root / 'tokenizer.json').write_text('{}', encoding='utf-8')
    reason = diagnose_model_reference_before_start(VllmServeConfig(model=str(root)))
    assert reason is not None
    assert 'wrong model type' in reason.lower()
