from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import Expense
from .serializers import ExpenseSerializer

# pyrefly: ignore [missing-import]
from accounts.permissions import ExpensePermission

class ExpenseViewSet(ModelViewSet):

    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [ExpensePermission]

    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]

    filterset_fields = [
        "category",
        "vehicle",
        "trip",
        "date",
    ]

    ordering_fields = [
        "amount",
        "date",
    ]

    search_fields = [
        "remarks",
    ]