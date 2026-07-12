from django.db import models
# pyrefly: ignore [missing-import]
from vehicles.models import Vehicle
# pyrefly: ignore [missing-import]
from drivers.models import Driver


class Trip(models.Model):

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        DISPATCHED = "DISPATCHED", "Dispatched"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="trips"
    )

    driver = models.ForeignKey(
        Driver,
        on_delete=models.CASCADE,
        related_name="trips",
        null=True,
        blank=True
    )

    source = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)

    cargo_weight = models.DecimalField(max_digits=10, decimal_places=2)

    planned_distance = models.DecimalField(max_digits=10, decimal_places=2)
    actual_distance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    fuel_consumed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )

    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Trip #{self.id}"