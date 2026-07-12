from django.db import models
from django.core.exceptions import ValidationError


class Vehicle(models.Model):

    class VehicleStatus(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        ON_TRIP = "ON_TRIP", "On Trip"
        IN_SHOP = "IN_SHOP", "In Shop"
        RETIRED = "RETIRED", "Retired"

    class VehicleType(models.TextChoices):
        VAN = "VAN", "Van"
        TRUCK = "TRUCK", "Truck"
        PICKUP = "PICKUP", "Pickup"
        BUS = "BUS", "Bus"
        OTHER = "OTHER", "Other"

    registration_number = models.CharField(
        max_length=20,
        unique=True
    )

    vehicle_name = models.CharField(max_length=100)

    vehicle_type = models.CharField(
        max_length=20,
        choices=VehicleType.choices,
        default=VehicleType.VAN
    )

    maximum_load_capacity = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    odometer = models.PositiveIntegerField(default=0)

    acquisition_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=VehicleStatus.choices,
        default=VehicleStatus.AVAILABLE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_operational_cost(self):
        from django.db.models import Sum
        # pyrefly: ignore [missing-import]
        from expenses.models import Expense
        fuel_cost = self.expenses.filter(category=Expense.Category.FUEL).aggregate(total=Sum("amount"))["total"] or 0
        maint_cost = self.expenses.filter(category=Expense.Category.MAINTENANCE).aggregate(total=Sum("amount"))["total"] or 0
        return float(fuel_cost + maint_cost)

    @property
    def vehicle_roi(self):
        from django.db.models import Sum
        total_revenue = self.trips.aggregate(total=Sum("revenue"))["total"] or 0
        op_cost = self.total_operational_cost
        acq_cost = float(self.acquisition_cost)
        if acq_cost > 0:
            return round((float(total_revenue) - op_cost) * 100 / acq_cost, 2)
        return 0.0

    def clean(self):
        if self.maximum_load_capacity <= 0:
            raise ValidationError("Maximum load capacity must be positive.")
    
    def __str__(self):
        return f"{self.registration_number} - {self.vehicle_name}"