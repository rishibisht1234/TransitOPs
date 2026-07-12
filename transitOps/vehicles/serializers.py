from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vehicle
        fields = "__all__"

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