from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Trip
from .serializers import TripSerializer
from vehicles.models import Vehicle


class TripViewSet(ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

    @action(detail=True, methods=["post"], url_path="dispatch")
    def dispatch_trip(self, request, pk=None):
        trip = self.get_object()

        if trip.status != Trip.Status.DRAFT:
            return Response(
                {"error": "Only draft trips can be dispatched."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if trip.vehicle.status != Vehicle.VehicleStatus.AVAILABLE:
            return Response(
                {"error": "Vehicle is not available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if trip.cargo_weight > trip.vehicle.maximum_load_capacity:
            return Response(
                {"error": "Cargo exceeds vehicle capacity."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        trip.status = Trip.Status.DISPATCHED
        trip.start_time = timezone.now()

        trip.vehicle.status = Vehicle.VehicleStatus.ON_TRIP

        trip.vehicle.save()
        trip.save()

        return Response(
            {
                "message": "Trip dispatched successfully.",
                "trip_status": trip.status,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="complete")
    def complete_trip(self, request, pk=None):
        trip = self.get_object()

        if trip.status != Trip.Status.DISPATCHED:
            return Response(
                {"error": "Only dispatched trips can be completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        actual_distance = request.data.get("actual_distance")
        fuel_consumed = request.data.get("fuel_consumed")

        if actual_distance is None:
            return Response(
                {"error": "actual_distance is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if fuel_consumed is None:
            return Response(
                {"error": "fuel_consumed is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        trip.actual_distance = actual_distance
        trip.fuel_consumed = fuel_consumed
        trip.end_time = timezone.now()
        trip.status = Trip.Status.COMPLETED

        trip.vehicle.status = Vehicle.VehicleStatus.AVAILABLE

        trip.vehicle.save()
        trip.save()

        return Response(
            {
                "message": "Trip completed successfully.",
                "trip_status": trip.status,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_trip(self, request, pk=None):
        trip = self.get_object()

        if trip.status == Trip.Status.COMPLETED:
            return Response(
                {"error": "Completed trip cannot be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        trip.status = Trip.Status.CANCELLED

        if trip.vehicle.status == Vehicle.VehicleStatus.ON_TRIP:
            trip.vehicle.status = Vehicle.VehicleStatus.AVAILABLE
            trip.vehicle.save()

        trip.save()

        return Response(
            {
                "message": "Trip cancelled successfully.",
                "trip_status": trip.status,
            },
            status=status.HTTP_200_OK,
        )