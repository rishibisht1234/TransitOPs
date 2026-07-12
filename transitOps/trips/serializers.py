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
        driver = attrs.get("driver")

        if not vehicle and self.instance:
            vehicle = self.instance.vehicle
        if cargo is None and self.instance:
            cargo = self.instance.cargo_weight
        if not driver and self.instance:
            driver = self.instance.driver

        if vehicle and cargo:
            if cargo > vehicle.maximum_load_capacity:
                raise serializers.ValidationError(
                    {
                        "cargo_weight":
                        "Cargo exceeds vehicle capacity."
                    }
                )

        if vehicle:
            # pyrefly: ignore [missing-import]
            from vehicles.models import Vehicle
            if vehicle.status in [Vehicle.VehicleStatus.IN_SHOP, Vehicle.VehicleStatus.RETIRED]:
                raise serializers.ValidationError(
                    {
                        "vehicle": f"Vehicle is currently {vehicle.status.lower().replace('_', ' ')} and cannot be assigned to a trip."
                    }
                )

        if driver:
            # pyrefly: ignore [missing-import]
            from drivers.models import Driver
            if driver.status == Driver.DriverStatus.SUSPENDED:
                raise serializers.ValidationError(
                    {
                        "driver": "Driver is suspended and cannot be assigned to a trip."
                    }
                )
            
            if driver.status == Driver.DriverStatus.ON_TRIP:
                is_same_trip = False
                if self.instance and self.instance.driver == driver and self.instance.status == Trip.Status.DISPATCHED:
                    is_same_trip = True
                
                if not is_same_trip:
                    raise serializers.ValidationError(
                        {
                            "driver": "Driver is currently on another trip and cannot be assigned."
                        }
                    )

        return attrs