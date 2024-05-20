import factory
from django.contrib.auth import get_user_model
from faker import Faker


User = get_user_model()
fake = Faker()


class UserFactory(factory.django.DjangoModelFactory):
    email = fake.email()

    class Meta:
        model = User

    @classmethod
    def _prepare(cls, create, **kwargs):
        password = "Testpass54321"
        if "password" in kwargs:
            password = kwargs.pop("password")
        user = super(UserFactory, cls)._prepare(create, **kwargs)
        user.set_password(password)
        if create:
            user.save()
        return user