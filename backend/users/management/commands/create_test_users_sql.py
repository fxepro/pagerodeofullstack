"""
Generate SQL statements to create test users for each role.

Usage:
    python manage.py create_test_users_sql
    python manage.py create_test_users_sql --output test_users.sql
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from django.db import connection
from django.contrib.auth.hashers import make_password


class Command(BaseCommand):
    help = 'Generate SQL statements to create test users for each role'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            default='Test123!',
            help='Password for all test users (default: Test123!)'
        )
        parser.add_argument(
            '--output',
            type=str,
            default=None,
            help='Output file path (default: print to stdout)'
        )
        parser.add_argument(
            '--email-domain',
            type=str,
            default='test.pagerodeo.com',
            help='Email domain for test users (default: test.pagerodeo.com)'
        )

    def handle(self, *args, **options):
        password = options['password']
        output_file = options['output']
        email_domain = options['email_domain']
        
        # Hash the password
        hashed_password = make_password(password)
        
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
        
        sql_statements = []
        sql_statements.append("-- SQL to create test users for each role")
        sql_statements.append(f"-- Password for all users: {password}")
        sql_statements.append(f"-- Generated password hash: {hashed_password}")
        sql_statements.append("")
        sql_statements.append("BEGIN;")
        sql_statements.append("")
        
        for user_data in TEST_USERS:
            username = user_data['username']
            email = user_data['email']
            first_name = user_data['first_name']
            last_name = user_data['last_name']
            role = user_data['role']
            group_name = user_data['group_name']
            
            # Get group ID (will be set at runtime)
            sql_statements.append(f"-- Create user: {username} ({role})")
            sql_statements.append(f"-- Group: {group_name}")
            sql_statements.append("")
            
            # Insert into auth_user (PostgreSQL syntax)
            sql_statements.append(f"""
-- Delete existing user if exists (to avoid conflicts)
DELETE FROM auth_user WHERE username = '{username}';

-- Insert new user
INSERT INTO auth_user (username, email, password, first_name, last_name, is_staff, is_superuser, is_active, date_joined)
VALUES (
    '{username}',
    '{email}',
    '{hashed_password}',
    '{first_name}',
    '{last_name}',
    false,
    false,
    true,
    NOW()
);
""")
            
            # Insert into users_userprofile
            sql_statements.append(f"""
-- Delete existing profile if exists
DELETE FROM users_userprofile WHERE user_id = (SELECT id FROM auth_user WHERE username = '{username}');

-- Insert new profile
INSERT INTO users_userprofile (user_id, role, email_verified, is_active, created_at, updated_at)
SELECT 
    u.id,
    '{role}',
    true,
    true,
    NOW(),
    NOW()
FROM auth_user u
WHERE u.username = '{username}';
""")
            
            # Remove from all groups first, then add to correct group
            sql_statements.append(f"""
-- Remove user from all groups
DELETE FROM auth_user_groups WHERE user_id = (SELECT id FROM auth_user WHERE username = '{username}');

-- Add user to correct group
INSERT INTO auth_user_groups (user_id, group_id)
SELECT 
    u.id,
    g.id
FROM auth_user u
CROSS JOIN auth_group g
WHERE u.username = '{username}'
  AND g.name = '{group_name}';
""")
            
            sql_statements.append("")
        
        sql_statements.append("COMMIT;")
        sql_statements.append("")
        sql_statements.append("-- Verify users were created:")
        sql_statements.append("SELECT u.username, u.email, p.role, g.name as group_name")
        sql_statements.append("FROM auth_user u")
        sql_statements.append("LEFT JOIN users_userprofile p ON u.id = p.user_id")
        sql_statements.append("LEFT JOIN auth_user_groups ug ON u.id = ug.user_id")
        sql_statements.append("LEFT JOIN auth_group g ON ug.group_id = g.id")
        sql_statements.append("WHERE u.username IN ('viewer', 'analyst', 'manager', 'director', 'admin_test');")
        
        sql_output = "\n".join(sql_statements)
        
        if output_file:
            with open(output_file, 'w') as f:
                f.write(sql_output)
            self.stdout.write(self.style.SUCCESS(f'SQL written to: {output_file}'))
        else:
            self.stdout.write(sql_output)
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ SQL generated for {len(TEST_USERS)} test users'))
        self.stdout.write(f'Password: {password}')
        self.stdout.write(f'Email domain: {email_domain}')

