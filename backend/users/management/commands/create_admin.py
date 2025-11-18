"""
Django management command to create an admin user with email_verified=True
Usage: python manage.py create_admin --email admin@example.com --password yourpassword
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import UserProfile


class Command(BaseCommand):
    help = 'Create an admin user with is_superuser, is_staff, and email_verified all set to true'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='Email address for the admin user'
        )
        parser.add_argument(
            '--username',
            type=str,
            default=None,
            help='Username (defaults to email if not provided)'
        )
        parser.add_argument(
            '--password',
            type=str,
            required=True,
            help='Password for the admin user'
        )
        parser.add_argument(
            '--first-name',
            type=str,
            default='Admin',
            help='First name (default: Admin)'
        )
        parser.add_argument(
            '--last-name',
            type=str,
            default='User',
            help='Last name (default: User)'
        )

    def handle(self, *args, **options):
        email = options['email']
        username = options['username'] or email.split('@')[0]
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        # Create or update user
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'is_superuser': True,
                'is_staff': True,
                'is_active': True,
            }
        )

        if not created:
            # Update existing user
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.is_superuser = True
            user.is_staff = True
            user.is_active = True
            user.save()
            self.stdout.write(self.style.WARNING(f'Updated existing user: {username}'))

        # Set password
        user.set_password(password)
        user.save()

        # Create or update UserProfile with email_verified = True
        profile, profile_created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': 'admin',
                'is_active': True,
                'email_verified': True,  # Set email_verified to True
            }
        )

        if not profile_created:
            # Update existing profile
            profile.role = 'admin'
            profile.is_active = True
            profile.email_verified = True  # Set email_verified to True
            profile.save()
            self.stdout.write(self.style.WARNING(f'Updated existing profile for: {username}'))

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created admin user:\n'
                f'  Username: {user.username}\n'
                f'  Email: {user.email}\n'
                f'  is_superuser: {user.is_superuser}\n'
                f'  is_staff: {user.is_staff}\n'
                f'  email_verified: {profile.email_verified}'
            )
        )

