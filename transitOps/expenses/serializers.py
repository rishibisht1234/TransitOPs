from django.db.models.fields import related_descriptors
from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):

    vehicle_name = serializers.CharField(
        source="vehicle.vehicle_name",
        read_only=True
    )

    trip_status = serializers.CharField(
        source="trip.status",
        read_only=True
    )

    class Meta:
        model = Expense
        fields = "__all__"
        read_only_fields = (
        "vehicle_name",
        "trip_status",
    )

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Amount must be greater than 0."
            )
        return value

    def validate(self, attrs):

        if attrs["category"] == Expense.Category.FUEL:

            if attrs.get("trip") is None:

                raise serializers.ValidationError(
                    "Fuel expense should be linked to a trip."
                )

        return attrs