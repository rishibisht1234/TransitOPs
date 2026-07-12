from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        FLEET_MANAGER = "FLEET_MANAGER", "Fleet Manager"
        DISPATCHER = "DISPATCHER", "Dispatcher"
        SAFETY_OFFICER = "SAFETY_OFFICER", "Safety Officer"
        FINANCIAL_ANALYST = "FINANCIAL_ANALYST", "Financial Analyst"

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.DISPATCHER
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def __str__(self):
        return self.email