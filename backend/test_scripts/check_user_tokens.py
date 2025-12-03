"""
Check all users and their email verification token status.
Run with: python manage.py shell -c "exec(open('test_scripts/check_user_tokens.py').read())"
"""

from django.contrib.auth.models import User
from users.models import UserProfile

print("\n" + "="*70)
print("Checking User Email Verification Token Status")
print("="*70 + "\n")

users = User.objects.all()
total_users = users.count()
users_without_tokens = 0
users_with_tokens = 0
users_without_profiles = 0

for user in users:
    try:
        profile = user.profile
        if profile.email_verification_token:
            users_with_tokens += 1
            status = "✓ Has token"
        else:
            users_without_tokens += 1
            status = "✗ No token"
            
        print(f"User: {user.username} ({user.email})")
        print(f"  Profile: {profile}")
        print(f"  Email Verified: {profile.email_verified}")
        print(f"  Token Status: {status}")
        if profile.email_verification_token:
            print(f"  Token (first 50 chars): {profile.email_verification_token[:50]}...")
        print(f"  Code: {profile.email_verification_code}")
        print(f"  Sent At: {profile.email_verification_sent_at}")
        print()
        
    except UserProfile.DoesNotExist:
        users_without_profiles += 1
        print(f"User: {user.username} ({user.email})")
        print(f"  ✗ No profile exists!")
        print()

print("="*70)
print("Summary:")
print(f"  Total Users: {total_users}")
print(f"  Users with tokens: {users_with_tokens}")
print(f"  Users without tokens: {users_without_tokens}")
print(f"  Users without profiles: {users_without_profiles}")
print("="*70 + "\n")

