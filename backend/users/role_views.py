from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import Permission as DjangoPermission, Group
from .role_models import Role
from .role_serializers import (
    RoleSerializer, RoleCreateSerializer, RoleUpdateSerializer, PermissionSerializer
)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_roles(request):
    """List all roles with their permissions"""
    try:
        # Define role order by seniority: Admin, Agency, Executive, Director, Manager, Analyst, Auditor, Viewer
        ROLE_ORDER = ['Admin', 'Agency', 'Executive', 'Director', 'Manager', 'Analyst', 'Auditor', 'Viewer']
        
        roles = Group.objects.all().prefetch_related('permissions')
        
        # Sort roles: system roles first (by seniority), then custom roles (alphabetically)
        def role_sort_key(role):
            if role.name in ROLE_ORDER:
                return (0, ROLE_ORDER.index(role.name))
            return (1, role.name.lower())
        
        sorted_roles = sorted(roles, key=role_sort_key)
        serializer = RoleSerializer(sorted_roles, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_role(request, role_id):
    """Get a specific role with its permissions"""
    role = get_object_or_404(Group, id=role_id)
    serializer = RoleSerializer(role)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_role(request):
    """Create a new role"""
    serializer = RoleCreateSerializer(data=request.data)
    if serializer.is_valid():
        role = serializer.save()
        # Return the full role data
        role_serializer = RoleSerializer(role)
        return Response(role_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_role(request, role_id):
    """Update a role and its permissions"""
    role = get_object_or_404(Group, id=role_id)
    
    # Prevent modification of system roles (capitalized names in Group model)
    # Ordered by seniority: Admin, Agency, Executive, Director, Manager, Analyst, Auditor, Viewer
    SYSTEM_ROLES = ['Admin', 'Agency', 'Executive', 'Director', 'Manager', 'Analyst', 'Auditor', 'Viewer']
    if role.name in SYSTEM_ROLES:
        return Response(
            {'error': f'System role "{role.name}" cannot be modified'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = RoleUpdateSerializer(role, data=request.data, partial=True)
    if serializer.is_valid():
        role = serializer.save()
        # Return the full role data
        role_serializer = RoleSerializer(role)
        return Response(role_serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_role(request, role_id):
    """Delete a role"""
    role = get_object_or_404(Group, id=role_id)
    
    # Prevent deletion of system roles (capitalized names in Group model)
    SYSTEM_ROLES = ['Viewer', 'Analyst', 'Manager', 'Director', 'Admin']
    if role.name in SYSTEM_ROLES:
        return Response(
            {'error': f'System role "{role.name}" cannot be deleted'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if role is in use
    from .models import UserProfile
    user_count = UserProfile.objects.filter(role=role.name).count()
    if user_count > 0:
        return Response(
            {'error': f'Cannot delete role. {user_count} users are assigned to this role.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    role.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_permissions(request):
    """List all available permissions"""
    try:
        permissions = DjangoPermission.objects.all().order_by('content_type__app_label', 'content_type__model', 'codename')
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_role_permissions(request, role_id):
    """Get permissions for a specific role"""
    role = get_object_or_404(Group, id=role_id)
    permissions = role.permissions.all()
    serializer = PermissionSerializer(permissions, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_role_permissions(request, role_id):
    """Update permissions for a specific role
    
    Note: System roles CAN have their permissions updated via UI,
    but their names cannot be changed. This allows admins to add
    new permissions to system roles as they are created.
    """
    from django.db import transaction
    
    role = get_object_or_404(Group, id=role_id)
    
    # System roles CAN have permissions updated, just not renamed/deleted
    # This allows adding new permissions to system roles as features are added
    
    permission_ids = request.data.get('permission_ids', [])
    
    # Validate permission IDs
    valid_permissions = DjangoPermission.objects.filter(id__in=permission_ids)
    if len(valid_permissions) != len(permission_ids):
        return Response(
            {'error': 'One or more permission IDs are invalid'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update permissions with transaction to ensure database save
    with transaction.atomic():
        role.permissions.set(valid_permissions)
        # Explicitly refresh from database to ensure changes are saved
        role.refresh_from_db()
    
    # Return updated role data
    serializer = RoleSerializer(role)
    return Response(serializer.data)
