from rest_framework.decorators import permission_classes
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.viewsets import ModelViewSet

from .models import Driver
from .serializers import DriverSerializer
# pyrefly: ignore [missing-import]
from accounts.permissions import SafetyOfficerPermission
from rest_framework import filters


class DriverViewSet(ModelViewSet):

    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [SafetyOfficerPermission]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
    "status",
    "license_category",
    ]

    search_fields = [
        "name",
        "license_number",
    ]

    ordering_fields = [
        "safety_score",
    ]