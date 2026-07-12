from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response

# pyrefly: ignore [missing-import]
from vehicles.models import Vehicle
# pyrefly: ignore [missing-import]
from trips.models import Trip
# pyrefly: ignore [missing-import]
from expenses.models import Expense

class ReportsAPIView(APIView):

    def get(self, request):

        total_distance = (
            Trip.objects.aggregate(
                total=Sum("actual_distance")
            )["total"] or 0
        )

        total_fuel = (
            Trip.objects.aggregate(
                total=Sum("fuel_consumed")
            )["total"] or 0
        )

        fuel_efficiency = (
            round(total_distance / total_fuel, 2)
            if total_fuel
            else 0
        )

        total_vehicles = Vehicle.objects.count()

        active_vehicles = Vehicle.objects.filter(
            status=Vehicle.VehicleStatus.ON_TRIP
        ).count()

        fleet_utilization = (
            round(active_vehicles * 100 / total_vehicles, 2)
            if total_vehicles
            else 0
        )

        fuel_cost = (
            Expense.objects.filter(
                category=Expense.Category.FUEL
            )
            .aggregate(total=Sum("amount"))["total"] or 0
        )

        maintenance_cost = (
            Expense.objects.filter(
                category=Expense.Category.MAINTENANCE
            )
            .aggregate(total=Sum("amount"))["total"] or 0
        )

        operational_cost = fuel_cost + maintenance_cost

        total_revenue = (
            Trip.objects.aggregate(
                total=Sum("revenue")
            )["total"] or 0
        )

        acquisition_cost = (
            Vehicle.objects.aggregate(
                total=Sum("acquisition_cost")
            )["total"] or 0
        )

        vehicle_roi = (
            round(
                (
                    total_revenue - operational_cost
                ) * 100 / acquisition_cost,
                2,
            )
            if acquisition_cost
            else 0
        )

        return Response({

            "fuel_efficiency": fuel_efficiency,

            "fleet_utilization": fleet_utilization,

            "fuel_cost": fuel_cost,

            "maintenance_cost": maintenance_cost,

            "operational_cost": operational_cost,

            "total_revenue": total_revenue,

            "vehicle_roi": vehicle_roi,

        })