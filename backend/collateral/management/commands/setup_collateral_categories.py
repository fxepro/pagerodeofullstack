"""
Management command to set up Collateral categories.

Usage:
    python manage.py setup_collateral_categories
"""

from django.core.management.base import BaseCommand
from collateral.models import CollateralCategory


class Command(BaseCommand):
    help = 'Set up Collateral categories (My Tools, Administration, Integrations) for learning materials'

    def handle(self, *args, **options):
        self.stdout.write('Setting up Collateral categories...')
        
        categories = [
            {
                'name': 'My Tools',
                'slug': 'my-tools',
                'description': 'Learning materials for My Tools features including Site Audit, Performance, Monitoring, Reports, and more.',
                'icon': 'Wrench',
                'order': 1
            },
            {
                'name': 'Administration',
                'slug': 'administration',
                'description': 'Learning materials for Administration features including User Management, Roles, Analytics, Settings, and more.',
                'icon': 'Shield',
                'order': 2
            },
            {
                'name': 'Integrations',
                'slug': 'integrations',
                'description': 'Learning materials for Integrations including Google Analytics, WordPress, Communication, and more.',
                'icon': 'Plug',
                'order': 3
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for cat_data in categories:
            category, created = CollateralCategory.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={
                    'name': cat_data['name'],
                    'description': cat_data['description'],
                    'icon': cat_data['icon'],
                    'order': cat_data['order']
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  [OK] Created category: {category.name}'))
            else:
                # Update existing category
                category.name = cat_data['name']
                category.description = cat_data['description']
                category.icon = cat_data['icon']
                category.order = cat_data['order']
                category.save()
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'  [UPDATED] Updated category: {category.name}'))
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Successfully set up Collateral categories! '
            f'Created: {created_count}, Updated: {updated_count}'
        ))
        self.stdout.write('')
        self.stdout.write('You can now add learning materials through Django Admin:')
        self.stdout.write('  1. Go to Django Admin > Collateral > Learning Materials > Add Learning Material')
        self.stdout.write('  2. Select one of the categories: My Tools, Administration, or Integrations')
        self.stdout.write('  3. Add tags like: site-audit, documentation, tutorial, video, etc.')
        self.stdout.write('  4. Set related_feature to match the feature slug (e.g., "site-audit")')
        self.stdout.write('  5. Set status to "Published" when ready')

