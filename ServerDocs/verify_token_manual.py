#!/usr/bin/env python
"""
Manually verify a token against the database
Usage: python verify_token_manual.py <token>
"""
import os
import sys
import django

# Correctly find the project root and add backend to sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, os.pardir))
backend_dir = os.path.join(project_root, 'backend')
sys.path.append(backend_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import UserProfile
from django.db.models import Q

def verify_token(token):
    """Verify a token against all profiles"""
    print(f"\n{'='*60}")
    print(f"Verifying token: {token}")
    print(f"{'='*60}\n")
    
    # Find all profiles with verification tokens or codes
    profiles = UserProfile.objects.filter(
        Q(email_verification_token__isnull=False) | 
        Q(email_verification_code__isnull=False)
    )
    
    print(f"Found {profiles.count()} profiles with verification data\n")
    
    matched = False
    for profile in profiles:
        print(f"Checking profile for user: {profile.user.email}")
        print(f"  email_verified: {profile.email_verified}")
        print(f"  email_verification_token: {'Set' if profile.email_verification_token else 'NULL'}")
        print(f"  email_verification_code: {profile.email_verification_code}")
        print(f"  email_verification_sent_at: {profile.email_verification_sent_at}")
        
        # Try token verification
        if profile.email_verification_token:
            token_match = profile.verify_token(token)
            print(f"  Token verification: {'✅ MATCH' if token_match else '❌ NO MATCH'}")
            if token_match:
                matched = True
                print(f"\n✅✅✅ TOKEN VERIFIED FOR USER: {profile.user.email}")
                print(f"   Token is valid and not expired: {not profile.is_token_expired()}")
                print(f"   Email already verified: {profile.email_verified}")
                break
        
        # Try code verification
        if profile.email_verification_code:
            code_match = profile.verify_code(token)
            print(f"  Code verification: {'✅ MATCH' if code_match else '❌ NO MATCH'}")
            if code_match:
                matched = True
                print(f"\n✅✅✅ CODE VERIFIED FOR USER: {profile.user.email}")
                print(f"   Code is valid and not expired: {not profile.is_token_expired()}")
                print(f"   Email already verified: {profile.email_verified}")
                break
        
        print()
    
    if not matched:
        print("❌❌❌ NO MATCHING PROFILE FOUND")
        print("\nPossible reasons:")
        print("  1. Token has already been used (cleared after verification)")
        print("  2. Token has expired (24 hours)")
        print("  3. Token doesn't match any user")
        print("  4. Wrong token format")
    
    print(f"\n{'='*60}\n")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python verify_token_manual.py <token>")
        print("Example: python verify_token_manual.py fd1fd04d-ad02-423e-b501-beaafd8587c5")
        sys.exit(1)
    
    token = sys.argv[1].strip()
    verify_token(token)

