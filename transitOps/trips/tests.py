from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
# pyrefly: ignore [missing-import]
from accounts.models import User
# pyrefly: ignore [missing-import]
from vehicles.models import Vehicle
# pyrefly: ignore [missing-import]
from drivers.models import Driver
# pyrefly: ignore [missing-import]
from trips.models import Trip

class TripAPITestCase(APITestCase):
    def setUp(self):
        # Create users
        self.admin = User.objects.create_superuser(
            email="admin@test.com",
            password="admin123",
            first_name="Admin",
            last_name="User",
        )
        self.client.force_authenticate(user=self.admin)

        # Create vehicle
        self.vehicle = Vehicle.objects.create(
            registration_number="PB08AB9999",
            vehicle_name="Vite Express",
            vehicle_type=Vehicle.VehicleType.VAN,
            maximum_load_capacity=2000,
            odometer=1000,
            acquisition_cost=Decimal("50000.00"),
            status=Vehicle.VehicleStatus.AVAILABLE,
        )

        # Create driver
        self.driver = Driver.objects.create(
            name="Ramesh Kumar",
            license_number="DL99999",
            license_category=Driver.LicenseCategory.HMV,
            license_expiry_date=timezone.now().date() + timedelta(days=365),
            contact_number="9876543210",
            safety_score=95,
            status=Driver.DriverStatus.AVAILABLE,
        )

        # Create trip (draft) without driver
        self.trip_no_driver = Trip.objects.create(
            vehicle=self.vehicle,
            driver=None,
            source="Delhi",
            destination="Mumbai",
            cargo_weight=500,
            planned_distance=200,
            status=Trip.Status.DRAFT,
        )

        # Create trip (draft) with driver
        self.trip_with_driver = Trip.objects.create(
            vehicle=self.vehicle,
            driver=self.driver,
            source="Delhi",
            destination="Mumbai",
            cargo_weight=500,
            planned_distance=200,
            status=Trip.Status.DRAFT,
        )

    def test_dispatch_trip_without_driver_error(self):
        # Should return 400 bad request instead of 500 server crash
        url = reverse("trips-dispatch-trip", args=[self.trip_no_driver.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Trip must have an assigned driver before dispatch.")

    def test_complete_trip_odometer_validation(self):
        # Dispatch the trip first
        url_dispatch = reverse("trips-dispatch-trip", args=[self.trip_with_driver.id])
        response_dispatch = self.client.post(url_dispatch)
        self.assertEqual(response_dispatch.status_code, status.HTTP_200_OK)

        # Re-fetch trip status from database
        self.trip_with_driver.refresh_from_db()
        self.assertEqual(self.trip_with_driver.status, Trip.Status.DISPATCHED)

        # Complete trip with smaller odometer (1000 - should fail)
        url_complete = reverse("trips-complete-trip", args=[self.trip_with_driver.id])
        response_fail = self.client.post(url_complete, {
            "actual_distance": 150.0,
            "fuel_consumed": 15.0,
            "final_odometer": 900  # less than starting odometer 1000
        })
        self.assertEqual(response_fail.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("must be greater than the vehicle's current odometer", response_fail.data["error"])

        # Complete trip with valid odometer (1150 - should succeed)
        response_success = self.client.post(url_complete, {
            "actual_distance": 150.0,
            "fuel_consumed": 15.0,
            "final_odometer": 1150
        })
        self.assertEqual(response_success.status_code, status.HTTP_200_OK)
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.odometer, 1150)
