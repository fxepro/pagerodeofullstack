#!/usr/bin/env python
"""
Test token generation on production to see what's happening
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from users.models import UserProfile
from site_settings.models import SiteConfig
import logging

# Set up logging to see errors
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

print("=" * 60)
print("Token Generation Test")
print("=" * 60)

# Check site config
print("\n[1] Checking site configuration...")
try:
    config = SiteConfig.get_config()
    print(f"   Email verification enabled: {config.enable_email_verification}")
    if not config.enable_email_verification:
        print("   ⚠️  WARNING: Email verification is DISABLED!")
        print("   Tokens will only be generated when enabled.")
except Exception as e:
    print(f"   ❌ Error getting config: {e}")

# Get a test user
print("\n[2] Finding test user...")
user = User.objects.order_by('-id').first()
if not user:
    print("   ❌ No users found!")
    sys.exit(1)

print(f"   Using user: {user.email} (ID: {user.id})")

# Get profile
try:
    profile = user.profile
    print(f"   ✅ Profile exists (ID: {profile.id})")
except UserProfile.DoesNotExist:
    print("   ⚠️  Profile doesn't exist, creating...")
    profile = UserProfile.objects.create(user=user, role='viewer', email_verified=False)
    print(f"   ✅ Profile created (ID: {profile.id})")

# Check current state
print("\n[3] Current profile state:")
print(f"   email_verified: {profile.email_verified}")
print(f"   email_verification_token: {'✅ Set' if profile.email_verification_token else '❌ NULL'}")
print(f"   email_verification_code: {profile.email_verification_code or '❌ NULL'}")
print(f"   email_verification_sent_at: {profile.email_verification_sent_at or '❌ NULL'}")

# Try generating token
print("\n[4] Attempting to generate token...")
try:
    # Clear existing token first
    profile.email_verification_token = None
    profile.email_verification_code = None
    profile.email_verification_sent_at = None
    profile.save()
    print("   Cleared existing tokens")
    
    # Generate new token
    token = profile.generate_verification_token()
    print(f"   ✅ Token generated: {token[:30]}...")
    
    # Refresh and verify
    profile.refresh_from_db()
    print("\n[5] After generation:")
    print(f"   email_verification_token: {'✅ Set (' + str(len(profile.email_verification_token)) + ' chars)' if profile.email_verification_token else '❌ NULL'}")
    print(f"   email_verification_code: {profile.email_verification_code or '❌ NULL'}")
    print(f"   email_verification_sent_at: {profile.email_verification_sent_at or '❌ NULL'}")
    
    if profile.email_verification_token and profile.email_verification_code:
        print("\n   ✅✅✅ SUCCESS! Token and code are in database!")
    else:
        print("\n   ❌❌❌ FAILED! Token or code not saved!")
        
except Exception as e:
    print(f"\n   ❌ ERROR generating token: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)

