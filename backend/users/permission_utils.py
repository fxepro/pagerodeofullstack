"""
Permission Utilities for RBAC

Helper functions for checking permissions and managing RBAC.
"""

from django.contrib.auth.models import User, Permission, Group
from .models import UserProfile


def has_permission(user, permission_code):
    """
    Check if user has a specific permission.
    
    Args:
        user: Django User instance
        permission_code: Permission code string (e.g., 'site_audit.view')
    
    Returns:
        bool: True if user has permission, False otherwise
    """
    # Superusers have all permissions
    if user.is_superuser:
        return True
    
    # Get user's role from profile
    try:
        profile = user.profile
        role_name = profile.role
    except UserProfile.DoesNotExist:
        return False
    
    # Get role's group - role names are capitalized in Group model
    try:
        # Capitalize first letter to match Group names (Viewer, Analyst, etc.)
        role_capitalized = role_name.capitalize() if role_name else None
        group = Group.objects.get(name=role_capitalized)
        
        # Check if group has the permission via Django Permission
        # Permission codename format: 'users.view' -> 'users_view'
        permission_codename = permission_code.replace('.', '_')
        
        # Get the content type for FeaturePermission (or use a generic one)
        from django.contrib.contenttypes.models import ContentType
        from .permission_models import FeaturePermission
        
        # Try to find the Django Permission by codename
        # The setup_permissions command creates permissions with codename = permission_code.replace('.', '_')
        try:
            # Use a generic content type or the FeaturePermission content type
            content_type = ContentType.objects.get_for_model(FeaturePermission)
            perm = Permission.objects.get(codename=permission_codename, content_type=content_type)
            return group.permissions.filter(id=perm.id).exists()
        except Permission.DoesNotExist:
            # Fallback: check if any permission with this codename exists
            return group.permissions.filter(codename=permission_codename).exists()
    except Group.DoesNotExist:
        return False


def get_user_permissions(user):
    """
    Get all permission codes for a user.
    
    Args:
        user: Django User instance
    
    Returns:
        list: List of permission code strings
    """
    if user.is_superuser:
        # Return all permissions for superuser
        from .permission_models import FeaturePermission
        return list(FeaturePermission.objects.values_list('code', flat=True))
    
    try:
        profile = user.profile
        role = profile.role
    except UserProfile.DoesNotExist:
        return []
    
    try:
        # Capitalize first letter to match Group names (Viewer, Analyst, etc.)
        role_capitalized = role.capitalize() if role else None
        group = Group.objects.get(name=role_capitalized)
        # Get all permissions for the group
        permissions = group.permissions.all()
        # Get permission codes from FeaturePermission model via linked Django permissions
        from .permission_models import FeaturePermission
        permission_codes = []
        for perm in permissions:
            # Try to find FeaturePermission linked to this Django permission
            try:
                feature_perm = FeaturePermission.objects.get(django_permission=perm)
                permission_codes.append(feature_perm.code)
            except FeaturePermission.DoesNotExist:
                # Fallback: convert Django permission codename to our format
                # This handles cases where FeaturePermission might not be linked yet
                code = perm.codename.replace('_', '.')
                permission_codes.append(code)
        return permission_codes
    except Group.DoesNotExist:
        return []


def filter_navigation_by_permissions(navigation_structure, user_permissions):
    """
    Filter navigation structure based on user permissions.
    
    Args:
        navigation_structure: Dict containing navigation sections and items
        user_permissions: List of permission codes user has
    
    Returns:
        dict: Filtered navigation structure
    """
    filtered_sections = []
    
    for section in navigation_structure.get('sections', []):
        # Check section-level permission if exists
        section_permission = section.get('permission')
        if section_permission and section_permission not in user_permissions:
            continue
        
        # Filter items in section
        filtered_items = []
        for item in section.get('items', []):
            item_permission = item.get('permission')
            if not item_permission or item_permission in user_permissions:
                filtered_items.append(item)
        
        # Only include section if it has visible items
        if filtered_items:
            section_copy = section.copy()
            section_copy['items'] = filtered_items
            filtered_sections.append(section_copy)
    
    result = navigation_structure.copy()
    result['sections'] = filtered_sections
    return result

