from django.contrib.auth import get_user_model
import pytest

pytestmark = pytest.mark.django_db
User = get_user_model()


class TestUserManager:
    def test_create_user(self, test_user):
        assert len(test_user.email) > 0
        assert test_user.is_active
        assert not test_user.is_staff
        assert not test_user.is_superuser

        try:
            assert test_user.username is None
        except AttributeError:
            pass
    
    def test_create_user_fail_no_data(self):
        with pytest.raises(TypeError):
            User.objects.create_user()
    
    def test_create_user_fail_blank_email(self):
        with pytest.raises(TypeError):
            User.objects.create_user(email="")
    
    def test_create_user_fail_blank_data(self):
        with pytest.raises(ValueError):
            User.objects.create_user(email="", password="")

    def test_create_superuser(self):
        admin_user = User.objects.create_superuser(email="clark@dailyplanet", password="superuser123")
        assert admin_user.email == "clark@dailyplanet"
        assert admin_user.is_active
        assert admin_user.is_staff
        assert admin_user.is_superuser

        try:
            assert admin_user.username is None
        except AttributeError:
            pass
    
    def test_create_superuser_fail_is_superuser_false_kwarg(self):
        with pytest.raises(ValueError):
            User.objects.create_superuser(email="super@example.com", password="foo", is_superuser=False)