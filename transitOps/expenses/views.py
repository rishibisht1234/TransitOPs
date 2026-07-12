from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import Expense
from .serializers import ExpenseSerializer

class ExpenseViewSet(ModelViewSet):

    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

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