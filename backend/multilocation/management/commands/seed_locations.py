"""
Django management command to seed AWS Lightsail regions as locations
"""

from django.core.management.base import BaseCommand
from multilocation.models import Location


class Command(BaseCommand):
    help = 'Seed AWS Lightsail regions as locations for PageSpeed/Lighthouse runners'

    AWS_LIGHTSAIL_REGIONS = [
        {'name': 'US East (N. Virginia)', 'region_code': 'us-east-1', 'region_id': 'us-east-1', 'country': 'United States', 'continent': 'North America'},
        {'name': 'US East (Ohio)', 'region_code': 'us-east-2', 'region_id': 'us-east-2', 'country': 'United States', 'continent': 'North America'},
        {'name': 'US West (Oregon)', 'region_code': 'us-west-2', 'region_id': 'us-west-2', 'country': 'United States', 'continent': 'North America'},
        {'name': 'Canada (Central)', 'region_code': 'ca-central-1', 'region_id': 'ca-central-1', 'country': 'Canada', 'continent': 'North America'},
        {'name': 'Asia Pacific (Jakarta)', 'region_code': 'ap-southeast-3', 'region_id': 'ap-southeast-3', 'country': 'Indonesia', 'continent': 'Asia Pacific'},
        {'name': 'Asia Pacific (Mumbai)', 'region_code': 'ap-south-1', 'region_id': 'ap-south-1', 'country': 'India', 'continent': 'Asia Pacific'},
        {'name': 'Asia Pacific (Seoul)', 'region_code': 'ap-northeast-2', 'region_id': 'ap-northeast-2', 'country': 'South Korea', 'continent': 'Asia Pacific'},
        {'name': 'Asia Pacific (Singapore)', 'region_code': 'ap-southeast-1', 'region_id': 'ap-southeast-1', 'country': 'Singapore', 'continent': 'Asia Pacific'},
        {'name': 'Asia Pacific (Sydney)', 'region_code': 'ap-southeast-2', 'region_id': 'ap-southeast-2', 'country': 'Australia', 'continent': 'Asia Pacific'},
        {'name': 'Asia Pacific (Tokyo)', 'region_code': 'ap-northeast-1', 'region_id': 'ap-northeast-1', 'country': 'Japan', 'continent': 'Asia Pacific'},
        {'name': 'EU (Frankfurt)', 'region_code': 'eu-central-1', 'region_id': 'eu-central-1', 'country': 'Germany', 'continent': 'Europe'},
        {'name': 'EU (Ireland)', 'region_code': 'eu-west-1', 'region_id': 'eu-west-1', 'country': 'Ireland', 'continent': 'Europe'},
        {'name': 'EU (London)', 'region_code': 'eu-west-2', 'region_id': 'eu-west-2', 'country': 'United Kingdom', 'continent': 'Europe'},
        {'name': 'EU (Paris)', 'region_code': 'eu-west-3', 'region_id': 'eu-west-3', 'country': 'France', 'continent': 'Europe'},
        {'name': 'EU (Stockholm)', 'region_code': 'eu-north-1', 'region_id': 'eu-north-1', 'country': 'Sweden', 'continent': 'Europe'},
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing locations before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            Location.objects.all().delete()
            self.stdout.write(self.style.WARNING('Cleared all existing locations'))

        created_count = 0
        updated_count = 0

        for region_data in self.AWS_LIGHTSAIL_REGIONS:
            location, created = Location.objects.get_or_create(
                region_code=region_data['region_code'],
                defaults={
                    'name': region_data['name'],
                    'region_id': region_data['region_id'],
                    'country': region_data['country'],
                    'continent': region_data['continent'],
                    'status': 'pending',
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created: {location.name} ({location.region_code})'))
            else:
                # Update existing location if needed
                updated = False
                for key, value in region_data.items():
                    if key != 'region_code' and getattr(location, key) != value:
                        setattr(location, key, value)
                        updated = True
                
                if updated:
                    location.save()
                    updated_count += 1
                    self.stdout.write(self.style.WARNING(f'Updated: {location.name} ({location.region_code})'))

        self.stdout.write(self.style.SUCCESS(
            f'\nSuccessfully seeded locations: {created_count} created, {updated_count} updated'
        ))
        self.stdout.write(f'Total locations in database: {Location.objects.count()}')

