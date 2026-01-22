"""
Management command to remove Compliance and Evidence permissions and sidebar items.

Usage:
    python manage.py remove_compliance_evidence
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission, Group
from users.permission_models import FeaturePermission


class Command(BaseCommand):
    help = 'Remove Compliance and Evidence permissions and sidebar items'

    def handle(self, *args, **options):
        self.stdout.write('Removing Compliance and Evidence permissions...')
        
        # Find and remove Compliance permissions
        compliance_perms = FeaturePermission.objects.filter(
            code__icontains='compliance'
        )
        compliance_count = compliance_perms.count()
        
        if compliance_count > 0:
            self.stdout.write(f'Found {compliance_count} Compliance permission(s)')
            for perm in compliance_perms:
                # Remove from all groups
                django_perm = perm.django_permission
                if django_perm:
                    for group in Group.objects.all():
                        group.permissions.remove(django_perm)
                    # Delete Django permission
                    django_perm.delete()
                # Delete FeaturePermission
                perm.delete()
                self.stdout.write(self.style.SUCCESS(f'  Removed: {perm.code}'))
        else:
            self.stdout.write('No Compliance permissions found')
        
        # Find and remove Evidence permissions
        evidence_perms = FeaturePermission.objects.filter(
            code__icontains='evidence'
        )
        evidence_count = evidence_perms.count()
        
        if evidence_count > 0:
            self.stdout.write(f'Found {evidence_count} Evidence permission(s)')
            for perm in evidence_perms:
                # Remove from all groups
                django_perm = perm.django_permission
                if django_perm:
                    for group in Group.objects.all():
                        group.permissions.remove(django_perm)
                    # Delete Django permission
                    django_perm.delete()
                # Delete FeaturePermission
                perm.delete()
                self.stdout.write(self.style.SUCCESS(f'  Removed: {perm.code}'))
        else:
            self.stdout.write('No Evidence permissions found')
        
        # Also check for Django permissions that might exist independently
        django_compliance_perms = Permission.objects.filter(
            codename__icontains='compliance'
        )
        django_evidence_perms = Permission.objects.filter(
            codename__icontains='evidence'
        )
        
        if django_compliance_perms.exists():
            self.stdout.write(f'Found {django_compliance_perms.count()} Django Compliance permission(s)')
            for perm in django_compliance_perms:
                # Remove from all groups
                for group in Group.objects.all():
                    group.permissions.remove(perm)
                perm.delete()
                self.stdout.write(self.style.SUCCESS(f'  Removed Django permission: {perm.codename}'))
        
        if django_evidence_perms.exists():
            self.stdout.write(f'Found {django_evidence_perms.count()} Django Evidence permission(s)')
            for perm in django_evidence_perms:
                # Remove from all groups
                for group in Group.objects.all():
                    group.permissions.remove(perm)
                perm.delete()
                self.stdout.write(self.style.SUCCESS(f'  Removed Django permission: {perm.codename}'))
        
        self.stdout.write(self.style.SUCCESS('\nCompliance and Evidence removal complete!'))
        self.stdout.write('Note: Sidebar items are defined in code (backend/users/permission_views.py)')
        self.stdout.write('      and do not need to be removed from the database.')

