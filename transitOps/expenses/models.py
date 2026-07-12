from django.db import models
# pyrefly: ignore [missing-import]
from vehicles.models import Vehicle
# pyrefly: ignore [missing-import]
from trips.models import Trip


class Expense(models.Model):

    class Category(models.TextChoices):
        FUEL = "FUEL", "Fuel"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
        TOLL = "TOLL", "Toll"
        PARKING = "PARKING", "Parking"
        OTHER = "OTHER", "Other"

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="expenses",
        null=True,
        blank=True
    )

    trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name="expenses",
        null=True,
        blank=True
    )

    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    remarks = models.TextField(blank=True)

    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.category} - ₹{self.amount}"