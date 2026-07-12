from datetime import date

from rest_framework import serializers

from .models import Driver


class DriverSerializer(serializers.ModelSerializer):

    class Meta:
        model = Driver
        fields = "__all__"

    def validate_license_expiry_date(self, value):
        if value <= date.today():
            raise serializers.ValidationError(
                "License expiry must be in the future."
            )
        return value

    def validate_safety_score(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError(
                "Safety score must be between 0 and 100."
            )
        return value