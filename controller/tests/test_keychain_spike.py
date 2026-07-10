from app.core.keychain import KeyringSecretBackend, describe_secret_backend


async def test_sqlite_secret_backend_report_is_active():
    report = await describe_secret_backend('sqlite', 'vcc-test')
    assert report.name == 'sqlite'
    assert report.active is True
    assert report.available is True
    assert report.service_name == 'vcc-test'
    assert report.migration_required is False


async def test_unknown_secret_backend_is_rejected():
    report = await describe_secret_backend('vault', 'vcc-test')
    assert report.name == 'vault'
    assert report.active is False
    assert report.available is False
    assert 'Unsupported' in report.message


async def test_keyring_backend_report_does_not_activate_keyring_yet():
    report = await describe_secret_backend('keyring', 'vcc-test')
    assert report.name == 'keyring'
    assert report.active is False
    assert report.migration_required is True
    assert report.service_name == 'vcc-test'


def test_keyring_adapter_has_stable_service_name():
    backend = KeyringSecretBackend('vcc-test')
    assert backend.name == 'keyring'
    assert backend.service_name == 'vcc-test'
