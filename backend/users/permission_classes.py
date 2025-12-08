"""
Custom Permission Classes for RBAC

Permission classes that check feature permissions instead of Django's built-in permissions.
"""

from rest_framework import permissions
from .permission_utils import has_permission


def HasFeaturePermission(permission_code):
    """
    Factory function that returns a permission class checking for a specific feature permission.
    
    Usage:
        @permission_classes([HasFeaturePermission('users.view')])
        def my_view(request):
            ...
    """
    class PermissionClass(permissions.BasePermission):
        def has_permission(self, request, view):
            if not request.user or not request.user.is_authenticated:
                return False
            return has_permission(request.user, permission_code)
    
    return PermissionClass

