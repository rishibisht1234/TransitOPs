from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from vehicles.models import Vehicle
# pyrefly: ignore [missing-import]
from drivers.models import Driver

# pyrefly: ignore [missing-import]
from trips.models import Trip
# pyrefly: ignore [missing-import]
from maintenance.models import Maintenance
# pyrefly: ignore [missing-import]
from expenses.models import Expense

class DashboardAPIView(APIView):

    def get(self, request):

        active_vehicles = Vehicle.objects.filter(
            status=Vehicle.VehicleStatus.ON_TRIP
        ).count()

        available_vehicles = Vehicle.objects.filter(
            status=Vehicle.VehicleStatus.AVAILABLE
        ).count()

        vehicles_in_shop = Vehicle.objects.filter(
            status=Vehicle.VehicleStatus.IN_SHOP
        ).count()

        active_trips = Trip.objects.filter(
            status=Trip.Status.DISPATCHED
        ).count()

        pending_trips = Trip.objects.filter(
            status=Trip.Status.DRAFT
        ).count()

        drivers_on_duty = Driver.objects.filter(
            status=Driver.DriverStatus.ON_TRIP
        ).count()

        total_vehicles = Vehicle.objects.count()

        fleet_utilization = (
            round(active_vehicles * 100 / total_vehicles, 2)
            if total_vehicles
            else 0
        )

        total_expenses = Expense.objects.count()
        total_expense_amount = (
            Expense.objects
            .aggregate(total=Sum("amount"))
            ["total"] or 0
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

        open_maintenance = Maintenance.objects.filter(
            status=Maintenance.MaintenanceStatus.OPEN
        ).count()

        total_drivers = Driver.objects.count()

        total_trips = Trip.objects.count()

        return Response({

            "active_vehicles": active_vehicles,

            "available_vehicles": available_vehicles,

            "vehicles_in_shop": vehicles_in_shop,

            "active_trips": active_trips,

            "pending_trips": pending_trips,

            "drivers_on_duty": drivers_on_duty,

            "fleet_utilization": fleet_utilization,

            "fuel_cost": fuel_cost,

            "maintenance_cost": maintenance_cost,

            "total_expenses": total_expenses,

            "total_expense_amount": total_expense_amount,

            "open_maintenance": open_maintenance,

            "total_drivers": total_drivers,

            "total_trips": total_trips,

        })