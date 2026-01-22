"""
Management command to set up Collateral tags for each category.

Usage:
    python manage.py setup_collateral_tags
"""

from django.core.management.base import BaseCommand
from collateral.models import CollateralCategory, CollateralTag


class Command(BaseCommand):
    help = 'Set up Collateral tags organized by category (My Tools, Administration, Integrations)'

    def handle(self, *args, **options):
        self.stdout.write('Setting up Collateral tags...')
        
        # Get categories
        try:
            my_tools_cat = CollateralCategory.objects.get(slug='my-tools')
            admin_cat = CollateralCategory.objects.get(slug='administration')
            integrations_cat = CollateralCategory.objects.get(slug='integrations')
        except CollateralCategory.DoesNotExist:
            self.stdout.write(self.style.ERROR('Categories not found. Run setup_collateral_categories first.'))
            return
        
        # Define tags for each category
        tags_by_category = {
            'my-tools': [
                {'name': 'Site Audit', 'slug': 'site-audit', 'description': 'Learning materials for Site Audit feature'},
                {'name': 'Performance', 'slug': 'performance', 'description': 'Learning materials for Performance analysis'},
                {'name': 'Monitoring', 'slug': 'monitoring', 'description': 'Learning materials for Monitoring features'},
                {'name': 'Reports', 'slug': 'reports', 'description': 'Learning materials for Reports and analytics'},
                {'name': 'AI Health', 'slug': 'ai-health', 'description': 'Learning materials for AI Monitoring'},
                {'name': 'Database Monitoring', 'slug': 'database-monitoring', 'description': 'Learning materials for Database Monitoring'},
                {'name': 'Security Monitoring', 'slug': 'security-monitoring', 'description': 'Learning materials for Security Monitoring'},
            ],
            'administration': [
                {'name': 'Admin Overview', 'slug': 'admin-overview', 'description': 'Learning materials for Administration overview'},
                {'name': 'User Management', 'slug': 'user-management', 'description': 'Learning materials for User Management'},
                {'name': 'Role Management', 'slug': 'roles', 'description': 'Learning materials for Role and Permission Management'},
                {'name': 'Analytics', 'slug': 'analytics', 'description': 'Learning materials for System Analytics'},
                {'name': 'API Monitoring', 'slug': 'api-monitoring', 'description': 'Learning materials for API Monitoring'},
                {'name': 'Tools Management', 'slug': 'tools-management', 'description': 'Learning materials for Tools Management'},
                {'name': 'Theme Manager', 'slug': 'themes', 'description': 'Learning materials for Theme Manager'},
                {'name': 'Feedback', 'slug': 'feedback', 'description': 'Learning materials for Feedback management'},
                {'name': 'Financials', 'slug': 'financials', 'description': 'Learning materials for Financial management'},
                {'name': 'Marketing & Deals', 'slug': 'marketing', 'description': 'Learning materials for Marketing and Deals'},
                {'name': 'Affiliates', 'slug': 'affiliates', 'description': 'Learning materials for Affiliate management'},
                {'name': 'Blogging', 'slug': 'blogging', 'description': 'Learning materials for Blog management'},
                {'name': 'System Settings', 'slug': 'system-settings', 'description': 'Learning materials for System Settings'},
                {'name': 'Multi-Language', 'slug': 'multi-language', 'description': 'Learning materials for Multi-Language support'},
                {'name': 'Multi-Currency', 'slug': 'multi-currency', 'description': 'Learning materials for Multi-Currency support'},
                {'name': 'Multi-Location', 'slug': 'multi-location', 'description': 'Learning materials for Multi-Location support'},
                {'name': 'Site Security', 'slug': 'security', 'description': 'Learning materials for Site Security'},
            ],
            'integrations': [
                {'name': 'Google Analytics', 'slug': 'google-analytics', 'description': 'Learning materials for Google Analytics integration'},
                {'name': 'WordPress', 'slug': 'wordpress', 'description': 'Learning materials for WordPress integration'},
                {'name': 'Communication', 'slug': 'communication', 'description': 'Learning materials for Communication integrations'},
            ],
        }
        
        # Also add general content type tags
        general_tags = [
            {'name': 'Documentation', 'slug': 'documentation', 'description': 'General documentation content'},
            {'name': 'Tutorial', 'slug': 'tutorial', 'description': 'Step-by-step tutorial content'},
            {'name': 'Video', 'slug': 'video', 'description': 'Video-based learning content'},
            {'name': 'Guide', 'slug': 'guide', 'description': 'Comprehensive guide content'},
            {'name': 'Quick Start', 'slug': 'quick-start', 'description': 'Quick start guide content'},
            {'name': 'Reference', 'slug': 'reference', 'description': 'Reference documentation'},
            {'name': 'FAQ', 'slug': 'faq', 'description': 'Frequently asked questions'},
        ]
        
        created_count = 0
        updated_count = 0
        
        # Create category-specific tags
        for category_slug, tags in tags_by_category.items():
            category = None
            if category_slug == 'my-tools':
                category = my_tools_cat
            elif category_slug == 'administration':
                category = admin_cat
            elif category_slug == 'integrations':
                category = integrations_cat
            
            self.stdout.write(f'\nSetting up tags for category: {category.name}')
            
            for tag_data in tags:
                tag, created = CollateralTag.objects.get_or_create(
                    slug=tag_data['slug'],
                    defaults={
                        'name': tag_data['name'],
                        'description': tag_data['description']
                    }
                )
                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f'  [OK] Created tag: {tag.name}'))
                else:
                    # Update existing tag
                    tag.name = tag_data['name']
                    tag.description = tag_data['description']
                    tag.save()
                    updated_count += 1
                    self.stdout.write(f'  [UPDATED] Updated tag: {tag.name}')
        
        # Create general content type tags
        self.stdout.write(f'\nSetting up general content type tags...')
        for tag_data in general_tags:
            tag, created = CollateralTag.objects.get_or_create(
                slug=tag_data['slug'],
                defaults={
                    'name': tag_data['name'],
                    'description': tag_data['description']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  [OK] Created tag: {tag.name}'))
            else:
                tag.name = tag_data['name']
                tag.description = tag_data['description']
                tag.save()
                updated_count += 1
                self.stdout.write(f'  [UPDATED] Updated tag: {tag.name}')
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Successfully set up Collateral tags! '
            f'Created: {created_count}, Updated: {updated_count}'
        ))
        self.stdout.write('')
        self.stdout.write('Tags are now available for use in learning materials:')
        self.stdout.write('  - Category-specific tags (e.g., site-audit, api-monitoring, google-analytics)')
        self.stdout.write('  - General content type tags (e.g., documentation, tutorial, video)')

