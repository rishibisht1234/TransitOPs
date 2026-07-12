from django.db import models


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

    def __str__(self):
        return f"{self.registration_number} - {self.vehicle_name}"