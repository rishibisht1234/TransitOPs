from rest_framework import serializers
from .models import Trip


class TripSerializer(serializers.ModelSerializer):

    class Meta:
        model = Trip
        fields = "__all__"

    def validate_cargo_weight(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Cargo weight must be greater than 0."
            )
        return value

    def validate_planned_distance(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Planned distance must be greater than 0."
            )
        return value

    def validate_revenue(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Revenue cannot be negative."
            )
        return value
    
    def validate(self, attrs):

        vehicle = attrs.get("vehicle")
        cargo = attrs.get("cargo_weight")

        if vehicle and cargo:
            if cargo > vehicle.maximum_load_capacity:
                raise serializers.ValidationError(
                    {
                        "cargo_weight":
                        "Cargo exceeds vehicle capacity."
                    }
                )

        return attrs