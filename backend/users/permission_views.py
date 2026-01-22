"""
Permission API Views for RBAC

API endpoints for permission checking and navigation.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import Group
from .permission_utils import has_permission, get_user_permissions, filter_navigation_by_permissions
from .permission_classes import HasFeaturePermission
from .models import UserProfile


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_permissions(request):
    """
    Check if user has specific permissions.
    
    Query params:
        permissions: Comma-separated list of permission codes to check
    
    Returns:
        {
            "permissions": {
                "site_audit.view": true,
                "users.view": false
            }
        }
    """
    permission_codes = request.GET.get('permissions', '').split(',')
    permission_codes = [p.strip() for p in permission_codes if p.strip()]
    
    if not permission_codes:
        return Response(
            {'error': 'No permissions specified'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    results = {}
    for code in permission_codes:
        results[code] = has_permission(request.user, code)
    
    return Response({'permissions': results})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_permissions(request):
    """
    Get all permissions for the current user.
    
    Returns:
        {
            "permissions": ["site_audit.view", "performance.view", ...]
        }
    """
    permissions = get_user_permissions(request.user)
    return Response({'permissions': permissions})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_navigation(request):
    """
    Get navigation structure filtered by user's permissions.
    
    Returns:
        Navigation structure with sections and items filtered by permissions
    """
    # Get user permissions
    user_permissions_list = get_user_permissions(request.user)
    
    # Debug logging (remove in production)
    import logging
    logger = logging.getLogger(__name__)
    logger.debug(f"User: {request.user.username}, Permissions: {user_permissions_list}")
    
    # Define navigation structure
    # Using existing /dashboard and /admin routes - no new pages created
    navigation_structure = {
        "sections": [
            {
                "id": "workspace",
                "title": "Workspace",
                "icon": "Home",
                "items": [
                    {
                        "id": "overview",
                        "title": "Overview",
                        "href": "/workspace",
                        "icon": "LayoutDashboard",
                        "permission": "dashboard.view"
                    }
                ]
            },
            {
                "id": "user_features",
                "title": "My Tools",
                "icon": "Tool",
                "items": [
                    {
                        "id": "site_audit",
                        "title": "Site Audit",
                        "href": "/workspace/site-audit",
                        "icon": "Search",
                        "permission": "site_audit.view"
                    },
                    {
                        "id": "performance",
                        "title": "Performance",
                        "href": "/workspace/performance",
                        "icon": "Gauge",
                        "permission": "performance.view"
                    },
                    {
                        "id": "monitoring",
                        "title": "Monitoring",
                        "href": "/workspace/monitoring",
                        "icon": "TrendingUp",
                        "permission": "monitoring.view"
                    },
                    {
                        "id": "reports",
                        "title": "Reports",
                        "href": "/workspace/reports",
                        "icon": "BarChart3",
                        "permission": "reports.view"
                    },
                    {
                        "id": "ai_health",
                        "title": "AI Monitoring",
                        "href": "/workspace/ai-health",
                        "icon": "Cpu",
                        "permission": "ai_health.view"
                    },
                    {
                        "id": "database_monitoring",
                        "title": "Database Monitoring",
                        "href": "/workspace/database-monitoring",
                        "icon": "Database",
                        "permission": "database_monitoring.view"
                    },
                    {
                        "id": "security_monitoring",
                        "title": "Security Monitoring",
                        "href": "/workspace/security-monitoring",
                        "icon": "Shield",
                        "permission": "security_monitoring.view"
                    },
                    {
                        "id": "security_audit",
                        "title": "Security Audit",
                        "href": "/workspace/security-audit",
                        "icon": "ShieldCheck",
                        "permission": "security_monitoring.view"
                    },
                    {
                        "id": "api_monitoring_user",
                        "title": "API Monitoring",
                        "href": "/workspace/api-monitoring-user",
                        "icon": "Network",
                        "permission": "api_monitoring_user.view"
                    },
                    {
                        "id": "seo_monitoring",
                        "title": "SEO Monitoring",
                        "href": "/workspace/seo-monitoring",
                        "icon": "Globe",
                        "permission": "seo_monitoring.view"
                    },
                    {
                        "id": "settings",
                        "title": "Settings",
                        "href": "/workspace/settings",
                        "icon": "Settings",
                        "permission": "profile.edit"
                    }
                ]
            },
            {
                "id": "collateral",
                "title": "Collateral",
                "icon": "GraduationCap",
                "items": [
                    {
                        "id": "collateral_main",
                        "title": "Learning & Resources",
                        "href": "/workspace/collateral",
                        "icon": "GraduationCap",
                        "permission": "collateral.view"
                    }
                ]
            },
            {
                "id": "integrations",
                "title": "Integrations",
                "icon": "Plug",
                "items": [
                    {
                        "id": "google_analytics",
                        "title": "Google Analytics",
                        "href": "/workspace/google-analytics",
                        "icon": "TrendingUp",
                        "permission": "google_analytics.view"
                    },
                    {
                        "id": "wordpress",
                        "title": "WordPress",
                        "href": "/workspace/wordpress",
                        "icon": "Package",
                        "permission": "wordpress.view"
                    },
                    {
                        "id": "communication",
                        "title": "Communication",
                        "href": "/workspace/communication",
                        "icon": "MessageSquare",
                        "permission": "communication.view"
                    }
                ]
            },
            {
                "id": "admin_features",
                "title": "Administration",
                "icon": "Shield",
                "permission": "users.view",
                "items": [
                    {
                        "id": "admin_overview",
                        "title": "Overview",
                        "href": "/workspace/admin-overview",
                        "icon": "LayoutDashboard",
                        "permission": "dashboard.view"
                    },
                    {
                        "id": "users",
                        "title": "User Management",
                        "href": "/workspace/users",
                        "icon": "Users",
                        "permission": "users.view"
                    },
                    {
                        "id": "roles",
                        "title": "Role Management",
                        "href": "/workspace/roles",
                        "icon": "Shield",
                        "permission": "roles.view"
                    },
                    {
                        "id": "analytics",
                        "title": "Analytics",
                        "href": "/workspace/analytics",
                        "icon": "BarChart3",
                        "permission": "analytics.view"
                    },
                    {
                        "id": "api_monitoring",
                        "title": "API Monitoring",
                        "href": "/workspace/api-monitoring",
                        "icon": "Network",
                        "permission": "api_monitoring.view"
                    },
                    {
                        "id": "tools_management",
                        "title": "Tools Management",
                        "href": "/workspace/tools-management",
                        "icon": "Wrench",
                        "permission": "tools.view"
                    },
                    {
                        "id": "themes",
                        "title": "Theme Manager",
                        "href": "/workspace/themes",
                        "icon": "Palette",
                        "permission": "themes.view"
                    },
                    {
                        "id": "feedback",
                        "title": "Feedback",
                        "href": "/workspace/feedback",
                        "icon": "MessageSquare",
                        "permission": "feedback.view"
                    },
                    {
                        "id": "financials",
                        "title": "Financials",
                        "href": "/workspace/financials",
                        "icon": "CreditCard",
                        "permission": "financials.view"
                    },
                    {
                        "id": "marketing",
                        "title": "Marketing & Deals",
                        "href": "/workspace/marketing",
                        "icon": "TrendingUp",
                        "permission": "marketing.view"
                    },
                    {
                        "id": "affiliates",
                        "title": "Affiliates",
                        "href": "/workspace/affiliates",
                        "icon": "Users",
                        "permission": "affiliates.view"
                    },
                    {
                        "id": "blogging",
                        "title": "Blogging",
                        "href": "/workspace/blogging",
                        "icon": "FileText",
                        "permission": "blog.view"
                    },
                    {
                        "id": "collateral_management",
                        "title": "Collateral",
                        "href": "/workspace/collateral-management",
                        "icon": "GraduationCap",
                        "permission": "users.view"
                    },
                    {
                        "id": "admin_settings",
                        "title": "System Settings",
                        "href": "/workspace/system-settings",
                        "icon": "Settings",
                        "permission": "settings.view"
                    },
                    {
                        "id": "multi_language",
                        "title": "Multi-Language",
                        "href": "/workspace/multi-language",
                        "icon": "Globe",
                        "permission": "users.view"
                    },
                    {
                        "id": "multi_currency",
                        "title": "Multi-Currency",
                        "href": "/workspace/multi-currency",
                        "icon": "CircleDollarSign",
                        "permission": "users.view"
                    },
                    {
                        "id": "multi_location",
                        "title": "Multi-Location",
                        "href": "/workspace/multi-location",
                        "icon": "MapPin",
                        "permission": "users.view"
                    },
                    {
                        "id": "security",
                        "title": "Site Security",
                        "href": "/workspace/security",
                        "icon": "Lock",
                        "permission": "users.view"
                    }
                ]
            },
            {
                "id": "account",
                "title": "Account",
                "icon": "User",
                "items": [
                    {
                        "id": "profile",
                        "title": "Profile",
                        "href": "/workspace/profile",
                        "icon": "User",
                        "permission": "profile.view"
                    }
                ]
            }
        ],
        "quickActions": [
            {
                "id": "new_audit",
                "title": "New Site Audit",
                "href": "/workspace/site-audit?new=true",
                "icon": "Plus",
                "permission": "site_audit.create"
            }
        ]
    }
    
    # Filter navigation by permissions
    filtered_navigation = filter_navigation_by_permissions(
        navigation_structure, 
        user_permissions_list
    )
    
    # Debug logging (remove in production)
    logger.debug(f"Filtered navigation sections: {len(filtered_navigation.get('sections', []))}")
    for section in filtered_navigation.get('sections', []):
        logger.debug(f"Section: {section.get('id')}, Items: {len(section.get('items', []))}")
        for item in section.get('items', []):
            logger.debug(f"  Item: {item.get('id')} ({item.get('title')}) - Permission: {item.get('permission')}")
    
    return Response(filtered_navigation)


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasFeaturePermission('roles.view')])
def get_sidebar_matrix(request):
    """
    Get sidebar matrix showing View/Edit/Both access for all roles.
    
    Returns matrix data with permission breakdown per role per sidebar item.
    """
    from django.contrib.auth.models import Group
    from .permission_models import FeaturePermission
    
    # Get all roles (system + custom)
    # Define role order by seniority: Admin, Agency, Executive, Director, Manager, Analyst, Auditor, Viewer
    ROLE_ORDER = ['Admin', 'Agency', 'Executive', 'Director', 'Manager', 'Analyst', 'Auditor', 'Viewer']
    
    def role_sort_key(group):
        if group.name in ROLE_ORDER:
            return (0, ROLE_ORDER.index(group.name))
        return (1, group.name.lower())
    
    all_groups = sorted(Group.objects.all(), key=role_sort_key)
    
    # Get navigation structure (same as get_navigation)
    navigation_structure = {
        "sections": [
            {
                "id": "workspace",
                "title": "Workspace",
                "icon": "Home",
                "items": [
                    {
                        "id": "overview",
                        "title": "Overview",
                        "href": "/workspace",
                        "icon": "LayoutDashboard",
                        "permission": "dashboard.view"
                    }
                ]
            },
            {
                "id": "user_features",
                "title": "My Tools",
                "icon": "Tool",
                "items": [
                    {
                        "id": "site_audit",
                        "title": "Site Audit",
                        "href": "/workspace/site-audit",
                        "icon": "Search",
                        "permission": "site_audit.view"
                    },
                    {
                        "id": "performance",
                        "title": "Performance",
                        "href": "/workspace/performance",
                        "icon": "Gauge",
                        "permission": "performance.view"
                    },
                    {
                        "id": "monitoring",
                        "title": "Monitoring",
                        "href": "/workspace/monitoring",
                        "icon": "TrendingUp",
                        "permission": "monitoring.view"
                    },
                    {
                        "id": "reports",
                        "title": "Reports",
                        "href": "/workspace/reports",
                        "icon": "BarChart3",
                        "permission": "reports.view"
                    },
                    {
                        "id": "ai_health",
                        "title": "AI Monitoring",
                        "href": "/workspace/ai-health",
                        "icon": "Cpu",
                        "permission": "ai_health.view"
                    },
                    {
                        "id": "database_monitoring",
                        "title": "Database Monitoring",
                        "href": "/workspace/database-monitoring",
                        "icon": "Database",
                        "permission": "database_monitoring.view"
                    },
                    {
                        "id": "security_monitoring",
                        "title": "Security Monitoring",
                        "href": "/workspace/security-monitoring",
                        "icon": "Shield",
                        "permission": "security_monitoring.view"
                    },
                    {
                        "id": "security_audit",
                        "title": "Security Audit",
                        "href": "/workspace/security-audit",
                        "icon": "ShieldCheck",
                        "permission": "security_monitoring.view"
                    },
                    {
                        "id": "api_monitoring_user",
                        "title": "API Monitoring",
                        "href": "/workspace/api-monitoring-user",
                        "icon": "Network",
                        "permission": "api_monitoring_user.view"
                    },
                    {
                        "id": "seo_monitoring",
                        "title": "SEO Monitoring",
                        "href": "/workspace/seo-monitoring",
                        "icon": "Globe",
                        "permission": "seo_monitoring.view"
                    },
                    {
                        "id": "settings",
                        "title": "Settings",
                        "href": "/workspace/settings",
                        "icon": "Settings",
                        "permission": "profile.edit"
                    }
                ]
            },
            {
                "id": "collateral",
                "title": "Collateral",
                "icon": "GraduationCap",
                "items": [
                    {
                        "id": "collateral_main",
                        "title": "Learning & Resources",
                        "href": "/workspace/collateral",
                        "icon": "GraduationCap",
                        "permission": "collateral.view"
                    }
                ]
            },
            {
                "id": "integrations",
                "title": "Integrations",
                "icon": "Plug",
                "items": [
                    {
                        "id": "google_analytics",
                        "title": "Google Analytics",
                        "href": "/workspace/google-analytics",
                        "icon": "TrendingUp",
                        "permission": "google_analytics.view"
                    },
                    {
                        "id": "wordpress",
                        "title": "WordPress",
                        "href": "/workspace/wordpress",
                        "icon": "Package",
                        "permission": "wordpress.view"
                    },
                    {
                        "id": "communication",
                        "title": "Communication",
                        "href": "/workspace/communication",
                        "icon": "MessageSquare",
                        "permission": "communication.view"
                    }
                ]
            },
            {
                "id": "admin_features",
                "title": "Administration",
                "icon": "Shield",
                "permission": "users.view",
                "items": [
                    {
                        "id": "admin_overview",
                        "title": "Overview",
                        "href": "/workspace/admin-overview",
                        "icon": "LayoutDashboard",
                        "permission": "dashboard.view"
                    },
                    {
                        "id": "users",
                        "title": "User Management",
                        "href": "/workspace/users",
                        "icon": "Users",
                        "permission": "users.view"
                    },
                    {
                        "id": "roles",
                        "title": "Role Management",
                        "href": "/workspace/roles",
                        "icon": "Shield",
                        "permission": "roles.view"
                    },
                    {
                        "id": "analytics",
                        "title": "Analytics",
                        "href": "/workspace/analytics",
                        "icon": "BarChart3",
                        "permission": "analytics.view"
                    },
                    {
                        "id": "api_monitoring",
                        "title": "API Monitoring",
                        "href": "/workspace/api-monitoring",
                        "icon": "Network",
                        "permission": "api_monitoring.view"
                    },
                    {
                        "id": "tools_management",
                        "title": "Tools Management",
                        "href": "/workspace/tools-management",
                        "icon": "Wrench",
                        "permission": "tools.view"
                    },
                    {
                        "id": "themes",
                        "title": "Theme Manager",
                        "href": "/workspace/themes",
                        "icon": "Palette",
                        "permission": "themes.view"
                    },
                    {
                        "id": "feedback",
                        "title": "Feedback",
                        "href": "/workspace/feedback",
                        "icon": "MessageSquare",
                        "permission": "feedback.view"
                    },
                    {
                        "id": "financials",
                        "title": "Financials",
                        "href": "/workspace/financials",
                        "icon": "CreditCard",
                        "permission": "financials.view"
                    },
                    {
                        "id": "marketing",
                        "title": "Marketing & Deals",
                        "href": "/workspace/marketing",
                        "icon": "TrendingUp",
                        "permission": "marketing.view"
                    },
                    {
                        "id": "affiliates",
                        "title": "Affiliates",
                        "href": "/workspace/affiliates",
                        "icon": "Users",
                        "permission": "affiliates.view"
                    },
                    {
                        "id": "blogging",
                        "title": "Blogging",
                        "href": "/workspace/blogging",
                        "icon": "FileText",
                        "permission": "blog.view"
                    },
                    {
                        "id": "collateral_management",
                        "title": "Collateral",
                        "href": "/workspace/collateral-management",
                        "icon": "GraduationCap",
                        "permission": "users.view"
                    },
                    {
                        "id": "admin_settings",
                        "title": "System Settings",
                        "href": "/workspace/system-settings",
                        "icon": "Settings",
                        "permission": "settings.view"
                    },
                    {
                        "id": "multi_language",
                        "title": "Multi-Language",
                        "href": "/workspace/multi-language",
                        "icon": "Globe",
                        "permission": "users.view"
                    },
                    {
                        "id": "multi_currency",
                        "title": "Multi-Currency",
                        "href": "/workspace/multi-currency",
                        "icon": "CircleDollarSign",
                        "permission": "users.view"
                    },
                    {
                        "id": "multi_location",
                        "title": "Multi-Location",
                        "href": "/workspace/multi-location",
                        "icon": "MapPin",
                        "permission": "users.view"
                    },
                    {
                        "id": "security",
                        "title": "Site Security",
                        "href": "/workspace/security",
                        "icon": "Lock",
                        "permission": "users.view"
                    }
                ]
            },
            {
                "id": "account",
                "title": "Account",
                "icon": "User",
                "items": [
                    {
                        "id": "profile",
                        "title": "Profile",
                        "href": "/workspace/profile",
                        "icon": "User",
                        "permission": "profile.view"
                    }
                ]
            }
        ]
    }
    
    # System roles that cannot be modified
    # Ordered by seniority: Admin, Agency, Executive, Director, Manager, Analyst, Auditor, Viewer
    SYSTEM_ROLES = ['Admin', 'Agency', 'Executive', 'Director', 'Manager', 'Analyst', 'Auditor', 'Viewer']
    
    # Build roles list
    roles_data = []
    for group in all_groups:
        roles_data.append({
            "id": group.id,
            "name": group.name,
            "is_system_role": group.name in SYSTEM_ROLES
        })
    
    # Build sidebar items with role access
    sidebar_items = []
    
    for section in navigation_structure.get('sections', []):
        for item in section.get('items', []):
            # Get required permissions for this item
            item_permission = item.get('permission', '')
            
            # Determine what permissions this item needs (view, create, edit, delete)
            required_permissions = {}
            if item_permission:
                # Base permission (e.g., "site_audit.view")
                base_code = item_permission.rsplit('.', 1)[0] if '.' in item_permission else item_permission
                
                # Check what permission types exist for this feature
                feature_perms = FeaturePermission.objects.filter(code__startswith=base_code + '.')
                for fp in feature_perms:
                    if '.view' in fp.code:
                        required_permissions['view'] = fp.code
                    elif '.create' in fp.code:
                        required_permissions['create'] = fp.code
                    elif '.edit' in fp.code:
                        required_permissions['edit'] = fp.code
                    elif '.delete' in fp.code:
                        required_permissions['delete'] = fp.code
                
                # If no feature perms found, use the base permission
                if not required_permissions:
                    required_permissions['view'] = item_permission
            
            # Get role access for this item
            role_access = {}
            for group in all_groups:
                # Get all permissions for this role
                role_perms = group.permissions.all()
                role_permission_codes = []
                
                for perm in role_perms:
                    try:
                        fp = FeaturePermission.objects.get(django_permission=perm)
                        role_permission_codes.append(fp.code)
                    except FeaturePermission.DoesNotExist:
                        # Fallback
                        code = perm.codename.replace('_', '.')
                        role_permission_codes.append(code)
                
                # Check which permissions this role has for this item
                access = {
                    "view": False,
                    "create": False,
                    "edit": False,
                    "delete": False
                }
                
                for perm_type, perm_code in required_permissions.items():
                    if perm_code in role_permission_codes:
                        access[perm_type] = True
                
                # Generate display value
                display_parts = []
                if access['view']:
                    display_parts.append('V')
                if access['create']:
                    display_parts.append('C')
                if access['edit']:
                    display_parts.append('E')
                if access['delete']:
                    display_parts.append('D')
                
                display = '+'.join(display_parts) if display_parts else '-'
                
                role_access[str(group.id)] = {
                    **access,
                    "display": display
                }
            
            sidebar_items.append({
                "id": item.get('id'),
                "title": item.get('title'),
                "section": section.get('id'),
                "section_title": section.get('title'),
                "required_permissions": required_permissions,
                "href": item.get('href'),
                "role_access": role_access
            })
    
    # Calculate summary
    summary = {
        "total_items": len(sidebar_items),
        "role_counts": {}
    }
    
    for group in all_groups:
        accessible_count = 0
        for item in sidebar_items:
            access = item['role_access'].get(str(group.id), {})
            if access.get('display') != '-':
                accessible_count += 1
        
        summary["role_counts"][str(group.id)] = accessible_count
    
    return Response({
        "roles": roles_data,
        "sidebar_items": sidebar_items,
        "summary": summary
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('roles.edit')])
def update_sidebar_matrix(request):
    """
    Update permissions for a role based on matrix changes.
    Expects: { role_id, permission_codes: [] }
    Allows updates for both system and custom roles (permissions can be changed, but system roles cannot be renamed/deleted).
    """
    from django.contrib.auth.models import Group, Permission
    from django.db import transaction
    from .permission_models import FeaturePermission
    
    role_id = request.data.get('role_id')
    permission_codes = request.data.get('permission_codes', [])
    
    if not role_id:
        return Response(
            {'error': 'role_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        role = Group.objects.get(id=role_id)
        
        # System roles CAN have their permissions edited, they just can't be renamed or deleted
        # This is the correct behavior - permissions should be editable for all roles
        
        # Get all FeaturePermissions for the provided codes
        feature_perms = FeaturePermission.objects.filter(code__in=permission_codes)
        
        # Get Django Permission objects linked to these FeaturePermissions
        django_perms = []
        from django.contrib.contenttypes.models import ContentType
        
        # Get content type for FeaturePermission
        content_type = ContentType.objects.get_for_model(FeaturePermission)
        
        for fp in feature_perms:
            if fp.django_permission:
                django_perms.append(fp.django_permission)
            else:
                # If no linked permission, try to find or create it
                codename = fp.code.replace('.', '_')
                perm, _ = Permission.objects.get_or_create(
                    codename=codename,
                    content_type=content_type,
                    defaults={'name': fp.name}
                )
                fp.django_permission = perm
                fp.save()
                django_perms.append(perm)
        
        # Update role permissions
        with transaction.atomic():
            role.permissions.set(django_perms)
            role.refresh_from_db()
        
        # Return updated role data
        return Response({
            'message': 'Permissions updated successfully',
            'role_id': role.id,
            'role_name': role.name,
            'permission_count': len(django_perms)
        })
        
    except Group.DoesNotExist:
        return Response(
            {'error': f'Role with id {role_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Error updating role: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

