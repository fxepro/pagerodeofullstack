"""
Management command to create a sample learning material for API Management.

Usage:
    python manage.py create_sample_material
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from collateral.models import CollateralCategory, CollateralTag, LearningMaterial


class Command(BaseCommand):
    help = 'Create a sample learning material for API Management'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample learning material for API Management...')
        
        # Get or create admin user (or first superuser)
        try:
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                admin_user = User.objects.first()
            if not admin_user:
                self.stdout.write(self.style.ERROR('No users found. Please create a user first.'))
                return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error getting user: {e}'))
            return
        
        # Get Administration category
        try:
            category = CollateralCategory.objects.get(slug='administration')
        except CollateralCategory.DoesNotExist:
            self.stdout.write(self.style.ERROR('Administration category not found. Run setup_collateral_categories first.'))
            return
        
        # Get or create tags
        tags_to_create = ['api-monitoring', 'documentation', 'guide']
        tags = []
        for tag_name in tags_to_create:
            tag, created = CollateralTag.objects.get_or_create(
                slug=tag_name,
                defaults={'name': tag_name.replace('-', ' ').title()}
            )
            tags.append(tag)
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created tag: {tag.name}'))
        
        # Create the learning material
        material_data = {
            'title': 'API Management Guide',
            'slug': 'api-management-guide',
            'excerpt': 'Learn how to use the API Management feature to monitor, analyze, and manage your API endpoints effectively.',
            'content': '''# API Management Guide

## Overview

The API Management feature allows you to monitor, analyze, and manage all your API endpoints in one place. This guide will walk you through the key features and how to use them.

## Getting Started

### Accessing API Management

1. Navigate to **Administration** → **API Monitoring** in the sidebar
2. You'll see a dashboard with all your API endpoints

### Key Features

#### 1. Endpoint Discovery

The system automatically discovers API endpoints from your application. You can also manually add endpoints.

#### 2. Status Monitoring

- **Active**: Endpoint is responding correctly
- **Warning**: Endpoint has issues but is still accessible
- **Error**: Endpoint is failing or unreachable

#### 3. Performance Metrics

Track important metrics:
- Response time
- Success rate
- Error rate
- Request volume

#### 4. Alert Management

Set up alerts for:
- Slow response times
- High error rates
- Endpoint downtime

## Best Practices

1. **Regular Monitoring**: Check your API status regularly
2. **Set Alerts**: Configure alerts for critical endpoints
3. **Review Logs**: Check activity logs for patterns
4. **Update Endpoints**: Keep your endpoint list up to date

## Troubleshooting

### Endpoint Not Responding

1. Check if the endpoint URL is correct
2. Verify network connectivity
3. Check server logs for errors

### High Error Rate

1. Review recent changes to the endpoint
2. Check server resources
3. Review error logs for patterns

## Next Steps

- Explore the detailed endpoint view for more information
- Set up automated monitoring schedules
- Configure alert thresholds

For more help, contact support or check the documentation.''',
            'author': admin_user,
            'category': category,
            'content_type': 'documentation',
            'status': 'published',
            'related_feature': 'api-monitoring',
            'related_feature_url': '/workspace/api-monitoring',
        }
        
        # Check if material already exists
        material, created = LearningMaterial.objects.get_or_create(
            slug=material_data['slug'],
            defaults=material_data
        )
        
        if created:
            # Add tags
            material.tags.set(tags)
            self.stdout.write(self.style.SUCCESS(f'  [OK] Created learning material: {material.title}'))
        else:
            # Update existing
            for key, value in material_data.items():
                if key != 'author':  # Don't change author
                    setattr(material, key, value)
            material.tags.set(tags)
            material.save()
            self.stdout.write(self.style.WARNING(f'  [UPDATED] Updated learning material: {material.title}'))
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Sample learning material created successfully!'))
        self.stdout.write(f'  Material ID: {material.id}')
        self.stdout.write(f'  Slug: {material.slug}')
        self.stdout.write(f'  URL: /workspace/collateral/{material.slug}')

