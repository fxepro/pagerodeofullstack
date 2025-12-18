"""
Django management command to create test users for each role.

Usage:
    python manage.py create_test_users
    python manage.py create_test_users --password mypassword  # Custom password for all
    python manage.py create_test_users --reset  # Reset existing test users
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from users.models import UserProfile


class Command(BaseCommand):
    help = 'Create test users for each role (Viewer, Analyst, Manager, Director, Admin)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            default='Test123!',
            help='Password for all test users (default: Test123!)'
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset existing test users (delete and recreate)'
        )
        parser.add_argument(
            '--email-domain',
            type=str,
            default='test.pagerodeo.com',
            help='Email domain for test users (default: test.pagerodeo.com)'
        )

    def handle(self, *args, **options):
        password = options['password']
        reset = options['reset']
        email_domain = options['email_domain']
        
        # Define test users for each role
        TEST_USERS = [
            {
                'username': 'viewer',
                'email': f'viewer@{email_domain}',
                'first_name': 'Test',
                'last_name': 'Viewer',
                'role': 'viewer',
                'group_name': 'Viewer',
            },
            {
                'username': 'analyst',
                'email': f'analyst@{email_domain}',
                'first_name': 'Test',
                'last_name': 'Analyst',
                'role': 'analyst',
                'group_name': 'Analyst',
            },
            {
                'username': 'manager',
                'email': f'manager@{email_domain}',
                'first_name': 'Test',
                'last_name': 'Manager',
                'role': 'manager',
                'group_name': 'Manager',
            },
            {
                'username': 'director',
                'email': f'director@{email_domain}',
                'first_name': 'Test',
                'last_name': 'Director',
                'role': 'director',
                'group_name': 'Director',
            },
            {
                'username': 'admin_test',
                'email': f'admin@{email_domain}',
                'first_name': 'Test',
                'last_name': 'Admin',
                'role': 'admin',
                'group_name': 'Admin',
            },
        ]
        
        self.stdout.write(self.style.SUCCESS('Creating test users for each role...\n'))
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        for user_data in TEST_USERS:
            username = user_data['username']
            email = user_data['email']
            first_name = user_data['first_name']
            last_name = user_data['last_name']
            role = user_data['role']
            group_name = user_data['group_name']
            
            try:
                # Check if user exists
                user_exists = User.objects.filter(username=username).exists()
                
                if user_exists and reset:
                    # Delete existing user
                    User.objects.filter(username=username).delete()
                    self.stdout.write(self.style.WARNING(f'Deleted existing user: {username}'))
                    user_exists = False
                
                if user_exists:
                    # Update existing user
                    user = User.objects.get(username=username)
                    user.email = email
                    user.first_name = first_name
                    user.last_name = last_name
                    user.is_active = True
                    user.set_password(password)
                    user.save()
                    
                    # Update profile
                    profile, _ = UserProfile.objects.get_or_create(user=user)
                    profile.role = role
                    profile.email_verified = True
                    profile.is_active = True
                    profile.save()
                    
                    # Update group membership
                    try:
                        group = Group.objects.get(name=group_name)
                        user.groups.clear()
                        user.groups.add(group)
                    except Group.DoesNotExist:
                        self.stdout.write(self.style.ERROR(f'  Group {group_name} does not exist. Run setup_roles first.'))
                    
                    updated_count += 1
                    self.stdout.write(self.style.WARNING(f'↻ Updated: {username} ({role})'))
                else:
                    # Create new user
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password=password,
                        first_name=first_name,
                        last_name=last_name,
                        is_active=True,
                    )
                    
                    # Create profile
                    profile = UserProfile.objects.create(
                        user=user,
                        role=role,
                        email_verified=True,
                        is_active=True,
                    )
                    
                    # Assign to group
                    try:
                        group = Group.objects.get(name=group_name)
                        user.groups.add(group)
                    except Group.DoesNotExist:
                        self.stdout.write(self.style.ERROR(f'  Group {group_name} does not exist. Run setup_roles first.'))
                    
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f'✓ Created: {username} ({role}) - {email}'))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Error creating {username}: {str(e)}'))
                skipped_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Summary:'))
        self.stdout.write(f'  Created: {created_count}')
        self.stdout.write(f'  Updated: {updated_count}')
        self.stdout.write(f'  Skipped/Errors: {skipped_count}')
        self.stdout.write(self.style.SUCCESS(f'\n✨ Test users created!\n'))
        self.stdout.write(self.style.SUCCESS('Login credentials:'))
        for user_data in TEST_USERS:
            self.stdout.write(f'  {user_data["username"]} ({user_data["role"]}): {user_data["email"]} / {password}')


