from django.db import models
# pyrefly: ignore [missing-import]
from vehicles.models import Vehicle


class Maintenance(models.Model):

    class MaintenanceStatus(models.TextChoices):
        OPEN = "OPEN", "Open"
        CLOSED = "CLOSED", "Closed"

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="maintenance_records"
    )

    issue = models.CharField(max_length=200)

    description = models.TextField(blank=True)

    cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=MaintenanceStatus.choices,
        default=MaintenanceStatus.OPEN
    )

    opened_date = models.DateField(auto_now_add=True)

    closed_date = models.DateField(
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.vehicle.registration_number} - {self.issue}"