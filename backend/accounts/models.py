import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Roles(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        AGENT = "AGENT", "Agent"
        SUPERVISOR = "SUPERVISOR", "Supervisor"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(
        max_length=20, choices=Roles.choices, default=Roles.CUSTOMER)

    def __str__(self):
        return f"{self.username} ({self.role})"
