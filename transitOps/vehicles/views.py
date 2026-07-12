from rest_framework.viewsets import ModelViewSet
from .models import Vehicle
from .serializers import VehicleSerializer
from django_filters.rest_framework import DjangoFilterBackend

class VehicleViewSet(ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "vehicle_type"]