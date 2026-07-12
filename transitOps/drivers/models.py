from django.db import models
from django.core.exceptions import ValidationError

class Driver(models.Model):

    class LicenseCategory(models.TextChoices):
        LMV = "LMV", "Light Motor Vehicle"
        HMV = "HMV", "Heavy Motor Vehicle"
        MCWG = "MCWG", "Motorcycle With Gear"
        OTHER = "OTHER", "Other"

    class DriverStatus(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        ON_TRIP = "ON_TRIP", "On Trip"
        OFF_DUTY = "OFF_DUTY", "Off Duty"
        SUSPENDED = "SUSPENDED", "Suspended"

    name = models.CharField(max_length=100)

    license_number = models.CharField(
        max_length=50,
        unique=True
    )

    license_category = models.CharField(
        max_length=20,
        choices=LicenseCategory.choices,
        default=LicenseCategory.LMV
    )

    license_expiry_date = models.DateField()

    contact_number = models.CharField(max_length=15)

    safety_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=100
    )

    status = models.CharField(
        max_length=20,
        choices=DriverStatus.choices,
        default=DriverStatus.AVAILABLE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.safety_score < 0 or self.safety_score > 100:
            raise ValidationError("Safety score must be between 0 and 100.")

    def __str__(self):
        return self.name