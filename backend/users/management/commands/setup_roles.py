from django.core.management.base import BaseCommand
from users.role_models import Role, Permission

class Command(BaseCommand):
    help = 'Setup default roles and permissions'

    def handle(self, *args, **options):
        # Create permissions
        permissions_data = [
            # User Management
            ('user_create', 'Create Users', 'Create new user accounts', 'user_management'),
            ('user_edit', 'Edit Users', 'Edit existing user accounts', 'user_management'),
            ('user_delete', 'Delete Users', 'Delete user accounts', 'user_management'),
            ('user_view', 'View Users', 'View user account information', 'user_management'),
            
            # Role Management
            ('role_create', 'Create Roles', 'Create new roles', 'role_management'),
            ('role_edit', 'Edit Roles', 'Edit existing roles', 'role_management'),
            ('role_delete', 'Delete Roles', 'Delete roles', 'role_management'),
            ('role_view', 'View Roles', 'View role information', 'role_management'),
            ('role_assign', 'Assign Roles', 'Assign roles to users', 'role_management'),
            
            # System Settings
            ('system_settings', 'System Settings', 'Configure system settings', 'system_settings'),
            ('system_backup', 'System Backup', 'Create and manage system backups', 'system_settings'),
            ('system_logs', 'View Logs', 'View system logs', 'system_settings'),
            
            # Analytics
            ('analytics_view', 'View Analytics', 'View analytics and reports', 'analytics'),
            ('analytics_export', 'Export Analytics', 'Export analytics data', 'analytics'),
            ('analytics_create', 'Create Reports', 'Create custom reports', 'analytics'),
            
            # Content Management
            ('content_create', 'Create Content', 'Create new content', 'content_management'),
            ('content_edit', 'Edit Content', 'Edit existing content', 'content_management'),
            ('content_delete', 'Delete Content', 'Delete content', 'content_management'),
            ('content_publish', 'Publish Content', 'Publish content', 'content_management'),
            
            # API Access
            ('api_read', 'API Read', 'Read access to API endpoints', 'api_access'),
            ('api_write', 'API Write', 'Write access to API endpoints', 'api_access'),
            ('api_admin', 'API Admin', 'Admin access to API endpoints', 'api_access'),
        ]

        # Create permissions
        for perm_id, name, description, category in permissions_data:
            permission, created = Permission.objects.get_or_create(
                id=perm_id,
                defaults={
                    'name': name,
                    'description': description,
                    'category': category
                }
            )
            if created:
                self.stdout.write(f'Created permission: {name}')

        # Create roles
        roles_data = [
            {
                'name': 'admin',
                'description': 'Full system access and control',
                'is_system_role': True,
                'permissions': [perm[0] for perm in permissions_data]  # All permissions
            },
            {
                'name': 'director',
                'description': 'High-level management access',
                'is_system_role': False,
                'permissions': [
                    'user_view', 'user_edit', 'role_view', 'role_assign',
                    'analytics_view', 'analytics_export', 'analytics_create',
                    'content_view', 'content_edit', 'content_publish',
                    'api_read', 'api_write'
                ]
            },
            {
                'name': 'manager',
                'description': 'Team management and oversight',
                'is_system_role': False,
                'permissions': [
                    'user_view', 'role_view', 'analytics_view', 'analytics_export',
                    'content_view', 'content_edit', 'api_read'
                ]
            },
            {
                'name': 'analyst',
                'description': 'Data analysis and reporting',
                'is_system_role': False,
                'permissions': [
                    'user_view', 'analytics_view', 'analytics_export', 'analytics_create',
                    'content_view', 'api_read'
                ]
            },
            {
                'name': 'viewer',
                'description': 'Read-only access to basic features',
                'is_system_role': True,
                'permissions': [
                    'user_view', 'analytics_view', 'content_view', 'api_read'
                ]
            }
        ]

        # Create roles
        for role_data in roles_data:
            permissions = role_data.pop('permissions')
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults=role_data
            )
            
            if created:
                self.stdout.write(f'Created role: {role.name}')
            
            # Assign permissions
            role_permissions = Permission.objects.filter(id__in=permissions)
            role.permissions.set(role_permissions)
            self.stdout.write(f'Assigned {role_permissions.count()} permissions to {role.name}')

        self.stdout.write(
            self.style.SUCCESS('Successfully setup roles and permissions!')
        )
