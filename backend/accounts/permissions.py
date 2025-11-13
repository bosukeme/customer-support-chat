from rest_framework import permissions


class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            print("User is not authenticated (AnonymousUser)")
            return False

        return getattr(request.user, 'role', None) == 'CUSTOMER'


class IsAgent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "AGENT"


class IsSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and \
            request.user.role == "SUPERVISOR"


class IsAgentOrSupervisor(permissions.BasePermission):
    """For endpoints accessible to both Agents and Supervisors"""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ["AGENT", "SUPERVISOR"]
        )
