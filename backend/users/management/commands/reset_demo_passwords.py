"""
Django management command to reset passwords for all demo accounts.

Usage:
    python manage.py reset_demo_passwords
    
This command is designed to be run via cron job every 48 hours.
"""

from django.core.management.base import BaseCommand
from django.core.cache import cache
from users.demo_utils import reset_all_demo_passwords, reset_demo_password, DEMO_PLANS


class Command(BaseCommand):
    help = 'Reset passwords for all demo accounts (analyst, auditor, manager, director, executive)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--show-passwords',
            action='store_true',
            help='Display the new passwords (for testing only)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Resetting passwords for all demo accounts...'))
        
        passwords = {}
        for plan_name in DEMO_PLANS:
            try:
                password = reset_demo_password(plan_name)
                passwords[plan_name] = password
                # Update cache with new password (48 hours = 172800 seconds)
                cache_key = f"demo_password_{plan_name}"
                cache.set(cache_key, password, 172800)
                self.stdout.write(self.style.SUCCESS(f'  ✓ Reset password for {plan_name}'))
            except Exception as e:
                passwords[plan_name] = None
                self.stdout.write(self.style.ERROR(f'  ✗ Failed to reset password for {plan_name}: {str(e)}'))
        
        success_count = sum(1 for p in passwords.values() if p is not None)
        failed_count = len(passwords) - success_count
        
        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Password reset complete! '
            f'Success: {success_count}, Failed: {failed_count}'
        ))
        
        if options['show_passwords']:
            self.stdout.write(self.style.WARNING('\nNew passwords:'))
            for plan_name, password in passwords.items():
                if password:
                    self.stdout.write(f'  {plan_name}: {password}')
                else:
                    self.stdout.write(self.style.ERROR(f'  {plan_name}: FAILED'))
        else:
            self.stdout.write(self.style.SUCCESS(
                '\nPasswords have been reset and cached. Use --show-passwords to display them (testing only).'
            ))

