#!/usr/bin/env python
"""
Quick check: Query database directly to see verification tokens
"""
import os
import sys
import django

# Fix path: Script can be run from anywhere
# Find project root (where ServerDocs folder is)
script_path = os.path.abspath(__file__)
# Go up from ServerDocs/check_verification_db.py to project root
project_root = os.path.dirname(os.path.dirname(script_path))
backend_dir = os.path.join(project_root, 'backend')

# Add backend to Python path
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Change to backend directory for Django to find settings
os.chdir(backend_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from users.models import UserProfile

print("Users with verification tokens:")
profiles = UserProfile.objects.filter(email_verification_token__isnull=False)
print(f"Found {profiles.count()} profiles with tokens\n")

for profile in profiles[:10]:
    print(f"User: {profile.user.email}")
    print(f"  Token: {'✅ Set (' + str(len(profile.email_verification_token)) + ' chars)' if profile.email_verification_token else '❌ NULL'}")
    print(f"  Code: {profile.email_verification_code or '❌ NULL'}")
    print(f"  Sent at: {profile.email_verification_sent_at}")
    print(f"  Verified: {profile.email_verified}")
    print()

print("\nUsers WITHOUT verification tokens:")
no_token = UserProfile.objects.filter(email_verification_token__isnull=True, email_verified=False)
print(f"Found {no_token.count()} profiles without tokens\n")

for profile in no_token[:10]:
    print(f"User: {profile.user.email} (ID: {profile.user.id})")
    print(f"  Created: {profile.created_at}")
    print()

