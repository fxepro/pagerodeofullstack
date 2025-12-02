#!/usr/bin/env python
"""
Diagnostic script to check why verification tokens aren't being created
Run this on the Oracle VM to debug the issue
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from users.models import UserProfile
from django.db import connection

print("=" * 60)
print("Verification Token Diagnostic")
print("=" * 60)

# Check 1: Database column exists
print("\n[1] Checking database schema...")
with connection.cursor() as cursor:
    cursor.execute("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users_userprofile' 
        AND column_name IN ('email_verification_token', 'email_verification_code', 'email_verification_sent_at')
        ORDER BY column_name;
    """)
    columns = cursor.fetchall()
    
    if columns:
        print("✅ Found columns:")
        for col in columns:
            print(f"   - {col[0]} ({col[1]}, nullable: {col[2]})")
    else:
        print("❌ Columns not found! Migration may not have been run.")
        print("   Run: python manage.py migrate")

# Check 2: Check recent users
print("\n[2] Checking recent users and their profiles...")
recent_users = User.objects.order_by('-id')[:5]
for user in recent_users:
    try:
        profile = user.profile
        print(f"\n   User: {user.email} (ID: {user.id})")
        print(f"   - Profile exists: ✅")
        print(f"   - email_verified: {profile.email_verified}")
        print(f"   - email_verification_token: {'✅ Set' if profile.email_verification_token else '❌ NULL'}")
        print(f"   - email_verification_code: {'✅ ' + profile.email_verification_code if profile.email_verification_code else '❌ NULL'}")
        print(f"   - email_verification_sent_at: {profile.email_verification_sent_at or '❌ NULL'}")
    except UserProfile.DoesNotExist:
        print(f"\n   User: {user.email} (ID: {user.id})")
        print(f"   - Profile: ❌ Does not exist")

# Check 3: Test token generation
print("\n[3] Testing token generation...")
test_user = User.objects.first()
if test_user:
    try:
        profile, created = UserProfile.objects.get_or_create(user=test_user)
        print(f"   Testing with user: {test_user.email}")
        
        # Try to generate token
        try:
            token = profile.generate_verification_token()
            print(f"   ✅ Token generated successfully: {token[:20]}...")
            
            # Refresh and check
            profile.refresh_from_db()
            if profile.email_verification_token:
                print(f"   ✅ Token saved to database")
            else:
                print(f"   ❌ Token NOT saved to database!")
            
            if profile.email_verification_code:
                print(f"   ✅ Code saved: {profile.email_verification_code}")
            else:
                print(f"   ❌ Code NOT saved!")
                
        except Exception as e:
            print(f"   ❌ Error generating token: {e}")
            import traceback
            traceback.print_exc()
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("   ⚠️  No users found to test with")

# Check 4: Check logs for errors
print("\n[4] Recent verification-related log entries...")
print("   (Check backend logs for 'verification' or 'token' errors)")
print("   Run: sudo journalctl -u pagerodeo-backend | grep -i verification | tail -20")

print("\n" + "=" * 60)
print("Diagnostic complete!")
print("=" * 60)

