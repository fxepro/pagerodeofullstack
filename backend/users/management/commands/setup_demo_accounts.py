"""
Django management command to create all demo accounts.

Usage:
    python manage.py setup_demo_accounts
    python manage.py setup_demo_accounts --with-data  # Also create sample data
"""

from django.core.management.base import BaseCommand
from django.core.cache import cache
from users.demo_utils import (
    get_or_create_demo_account,
    reset_demo_password,
    create_demo_sample_data,
    DEMO_PLANS
)


class Command(BaseCommand):
    help = 'Create demo accounts for all plan tiers (analyst, auditor, manager, director, executive)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--with-data',
            action='store_true',
            help='Also create sample monitoring data for each demo account',
        )
        parser.add_argument(
            '--reset-passwords',
            action='store_true',
            help='Reset passwords for existing demo accounts',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up demo accounts...'))
        
        created_count = 0
        updated_count = 0
        
        for plan_name in DEMO_PLANS:
            try:
                user, created = get_or_create_demo_account(plan_name)
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Created demo account: {user.username} ({user.email})')
                    )
                else:
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'→ Demo account already exists: {user.username}')
                    )
                
                # Reset password (or set initial password)
                if options['reset_passwords'] or created:
                    password = reset_demo_password(plan_name)
                    # Cache password for 48 hours (172800 seconds)
                    cache_key = f"demo_password_{plan_name}"
                    cache.set(cache_key, password, 172800)
                    self.stdout.write(
                        self.style.SUCCESS(f'  Password set/reset for {user.username}')
                    )
                    # Show password in development mode only
                    if options.get('verbosity', 1) >= 2:
                        self.stdout.write(
                            self.style.SUCCESS(f'  Password: {password}')
                        )
                
                # Create sample data if requested
                if options['with_data']:
                    create_demo_sample_data(plan_name)
                    self.stdout.write(
                        self.style.SUCCESS(f'  Sample data created for {user.username}')
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to setup {plan_name} demo account: {str(e)}')
                )
        
        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Demo accounts setup complete! '
            f'Created: {created_count}, Already existed: {updated_count}'
        ))
        
        if not options['reset_passwords'] and not created_count:
            self.stdout.write(self.style.WARNING(
                '\nNote: Use --reset-passwords to reset passwords for existing accounts'
            ))

