from django.test import TestCase
from decimal import Decimal
from vehicles.models import Vehicle
from trips.models import Trip
from expenses.models import Expense

class VehiclePropertiesTestCase(TestCase):
    def setUp(self):
        self.vehicle = Vehicle.objects.create(
            registration_number="PB08AB1234",
            vehicle_name="Test Truck",
            vehicle_type=Vehicle.VehicleType.TRUCK,
            maximum_load_capacity=1000,
            odometer=5000,
            acquisition_cost=Decimal("100000.00"),
            status=Vehicle.VehicleStatus.AVAILABLE,
        )

    def test_total_operational_cost_and_roi(self):
        # Create expenses
        Expense.objects.create(
            vehicle=self.vehicle,
            category=Expense.Category.FUEL,
            amount=Decimal("1500.00"),
        )
        Expense.objects.create(
            vehicle=self.vehicle,
            category=Expense.Category.MAINTENANCE,
            amount=Decimal("2500.00"),
        )
        Expense.objects.create(
            vehicle=self.vehicle,
            category=Expense.Category.TOLL,
            amount=Decimal("500.00"),  # non-operational
        )

        # Create trips with revenue
        Trip.objects.create(
            vehicle=self.vehicle,
            source="A",
            destination="B",
            cargo_weight=500,
            planned_distance=100,
            revenue=Decimal("14000.00"),
        )

        # Operational Cost = Fuel (1500) + Maintenance (2500) = 4000
        self.assertEqual(self.vehicle.total_operational_cost, 4000.0)

        # ROI = (Revenue (14000) - Operational Cost (4000)) * 100 / Acquisition Cost (100000) = 10.0%
        self.assertEqual(self.vehicle.vehicle_roi, 10.0)
