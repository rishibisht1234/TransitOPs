from rest_framework.viewsets import ModelViewSet
from .models import Vehicle
from .serializers import VehicleSerializer
from django_filters.rest_framework import DjangoFilterBackend
# pyrefly: ignore [missing-import]
from accounts.permissions import FleetManagerPermission
from rest_framework import filters

class VehicleViewSet(ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [FleetManagerPermission]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = ["status", "vehicle_type"]
    search_fields = ["registration_number", "vehicle_name"]
    ordering_fields = ["odometer", "created_at"]