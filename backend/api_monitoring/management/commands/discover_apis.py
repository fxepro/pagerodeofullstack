"""
Management command to discover APIs from a base URL
Usage: python manage.py discover_apis http://localhost:8000
"""

from django.core.management.base import BaseCommand
from api_monitoring.models import APIEndpoint
from api_monitoring.utils import discover_api_endpoints


class Command(BaseCommand):
    help = 'Discover API endpoints from a base URL and add them to monitoring'

    def add_arguments(self, parser):
        parser.add_argument('base_url', type=str, help='Base URL to discover APIs from (e.g., http://localhost:8000)')
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be discovered without creating endpoints',
        )

    def handle(self, *args, **options):
        base_url = options['base_url']
        dry_run = options['dry_run']
        
        self.stdout.write(self.style.SUCCESS(f'Discovering APIs from: {base_url}'))
        
        discovered = discover_api_endpoints(base_url)
        
        if not discovered:
            self.stdout.write(self.style.WARNING('No APIs discovered'))
            return
        
        found_apis = [api for api in discovered if api['found']]
        self.stdout.write(self.style.SUCCESS(f'Found {len(found_apis)} working APIs'))
        
        if dry_run:
            self.stdout.write('\nWould create:')
            for api in found_apis:
                self.stdout.write(f"  - {api['method']} {api['url']} (Status: {api['status_code']})")
            return
        
        created = 0
        skipped = 0
        
        for api in found_apis:
            endpoint, created_flag = APIEndpoint.objects.get_or_create(
                url=api['url'],
                method=api['method'],
                defaults={
                    'name': f"Discovered: {api['url']}",
                    'expected_status_code': api['status_code'],
                    'is_active': True
                }
            )
            if created_flag:
                created += 1
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created: {api['url']}'))
            else:
                skipped += 1
                self.stdout.write(self.style.WARNING(f'  - Skipped (exists): {api['url']}'))
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Created {created} new endpoint(s), skipped {skipped} existing'))

