"""
Management command to rename 'Test Role New' to 'Auditor' and set up Auditor role.

Usage:
    python manage.py remove_test_role
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from users.models import UserProfile
from users.permission_models import FeaturePermission
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = "Rename 'Test Role New' to 'Auditor' and ensure Auditor role is properly configured"

    def handle(self, *args, **options):
        try:
            # Check if "Test Role New" exists
            test_role = None
            try:
                test_role = Group.objects.get(name='Test Role New')
                self.stdout.write('Found "Test Role New" role.')
            except Group.DoesNotExist:
                self.stdout.write('"Test Role New" role does not exist.')
            
            # Get or create Auditor role
            auditor_role, created = Group.objects.get_or_create(name='Auditor')
            
            if test_role:
                # Check if any users are assigned to Test Role New
                user_count = UserProfile.objects.filter(role='test role new').count()
                
                if user_count > 0:
                    # Update users to auditor role
                    UserProfile.objects.filter(role='test role new').update(role='auditor')
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Reassigned {user_count} users from "Test Role New" to "Auditor" role.'
                        )
                    )
                
                # Transfer permissions from Test Role New to Auditor if Auditor is new
                if created and test_role.permissions.exists():
                    auditor_role.permissions.set(test_role.permissions.all())
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Transferred {test_role.permissions.count()} permissions from "Test Role New" to "Auditor".'
                        )
                    )
                
                # Delete Test Role New
                test_role.delete()
                self.stdout.write(
                    self.style.SUCCESS('Successfully renamed "Test Role New" to "Auditor".')
                )
            elif created:
                self.stdout.write('Created "Auditor" role.')
            
            # Ensure Auditor has the correct permissions
            self.stdout.write('\nSetting up Auditor permissions...')
            
            # Define Auditor permissions (read-only with reporting)
            auditor_permissions = [
                'dashboard.view',
                'site_audit.view',
                'performance.view',
                'monitoring.view',
                'reports.view',
                'reports.export',
                'ai_health.view',
                'google_analytics.view',
                'api_monitoring_user.view',
                'profile.view',
                'profile.edit',
                'analytics.view',
            ]
            
            # Get content type for FeaturePermission
            content_type = ContentType.objects.get_for_model(FeaturePermission)
            
            # Clear existing permissions
            auditor_role.permissions.clear()
            
            assigned_count = 0
            for perm_code in auditor_permissions:
                try:
                    # Get FeaturePermission
                    feature_perm = FeaturePermission.objects.get(code=perm_code)
                    
                    # Create Django permission if it doesn't exist
                    codename = perm_code.replace('.', '_')
                    perm_name = perm_code.replace('.', ' ').title()
                    
                    perm, _ = Permission.objects.get_or_create(
                        codename=codename,
                        content_type=content_type,
                        defaults={'name': perm_name}
                    )
                    
                    # Link FeaturePermission to Django Permission
                    if not feature_perm.django_permission:
                        feature_perm.django_permission = perm
                        feature_perm.save()
                    
                    auditor_role.permissions.add(perm)
                    assigned_count += 1
                except FeaturePermission.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f'  FeaturePermission {perm_code} does not exist')
                    )
            
            self.stdout.write(
                self.style.SUCCESS(f'  Assigned {assigned_count} permissions to Auditor role.')
            )
            
            self.stdout.write(
                self.style.SUCCESS('\n✅ Auditor role is now properly configured!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            )
            import traceback
            self.stdout.write(traceback.format_exc())

