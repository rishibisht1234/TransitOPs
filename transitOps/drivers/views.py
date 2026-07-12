from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.viewsets import ModelViewSet

from .models import Driver
from .serializers import DriverSerializer


class DriverViewSet(ModelViewSet):

    queryset = Driver.objects.all()
    serializer_class = DriverSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        "status",
        "license_category",
    ]