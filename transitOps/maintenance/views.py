from datetime import date

from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Maintenance
from .serializers import MaintenanceSerializer
# pyrefly: ignore [missing-import]
from vehicles.models import Vehicle
# pyrefly: ignore [missing-import]
from accounts.permissions import FleetManagerPermission 


class MaintenanceViewSet(ModelViewSet):

    queryset = Maintenance.objects.all()
    serializer_class = MaintenanceSerializer
    permission_classes = [FleetManagerPermission]

    def perform_create(self, serializer):

        maintenance = serializer.save()

        vehicle = maintenance.vehicle
        vehicle.status = Vehicle.VehicleStatus.IN_SHOP
        vehicle.save()

    def perform_update(self, serializer):

        previous = self.get_object()

        maintenance = serializer.save()

        if (
            previous.status == Maintenance.MaintenanceStatus.OPEN
            and maintenance.status == Maintenance.MaintenanceStatus.CLOSED
        ):

            maintenance.closed_date = date.today()
            maintenance.save()

            vehicle = maintenance.vehicle

            if vehicle.status != Vehicle.VehicleStatus.RETIRED:
                vehicle.status = Vehicle.VehicleStatus.AVAILABLE
                vehicle.save()