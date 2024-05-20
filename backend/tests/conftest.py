import pytest
from tests.factories import UserFactory

@pytest.fixture(autouse=True)
def media_storage(settings, tmpdir) -> None:
    settings.MEDIA_ROOT = tmpdir.strpath


@pytest.fixture
def test_user():
    yield UserFactory()