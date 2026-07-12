from rest_framework import serializers
from .models import Maintenance


class MaintenanceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Maintenance
        fields = "__all__"

    def validate_vehicle(self, vehicle):
        if vehicle.status == vehicle.VehicleStatus.RETIRED:
            raise serializers.ValidationError(
                "Cannot create maintenance for a retired vehicle."
            )
        return vehicle