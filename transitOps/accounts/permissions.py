from rest_framework.permissions import BasePermission, SAFE_METHODS


class FleetManagerPermission(BasePermission):
    """
    Everyone can view.
    Only Admin and Fleet Manager can modify.
    """

    def has_permission(self, request, view):

        if request.method in SAFE_METHODS:
            return request.user.is_authenticated

        return (
            request.user.is_authenticated
            and request.user.role in ["ADMIN", "FLEET_MANAGER"]
        )


class SafetyOfficerPermission(BasePermission):
    """
    Everyone can view.
    Only Admin and Safety Officer can modify.
    """

    def has_permission(self, request, view):

        if request.method in SAFE_METHODS:
            return request.user.is_authenticated

        return (
            request.user.is_authenticated
            and request.user.role in ["ADMIN", "SAFETY_OFFICER"]
        )