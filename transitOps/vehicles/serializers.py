from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    total_operational_cost = serializers.ReadOnlyField()
    vehicle_roi = serializers.ReadOnlyField()

    class Meta:
        model = Vehicle
        fields = [
            "id",
            "registration_number",
            "vehicle_name",
            "vehicle_type",
            "maximum_load_capacity",
            "odometer",
            "acquisition_cost",
            "status",
            "created_at",
            "updated_at",
            "total_operational_cost",
            "vehicle_roi",
        ]

    def validate_maximum_load_capacity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Capacity must be greater than 0."
            )
        return value

    def validate_acquisition_cost(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Cost cannot be negative."
            )
        return value