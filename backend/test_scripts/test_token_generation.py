"""
Test script to verify email verification token generation is working correctly.
Run with: python manage.py shell < test_scripts/test_token_generation.py
Or: python manage.py shell -c "exec(open('test_scripts/test_token_generation.py').read())"
"""

from django.contrib.auth.models import User
from users.models import UserProfile
import logging

logger = logging.getLogger(__name__)

def test_token_generation():
    """Test token generation for a user"""
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        username='test_token_user',
        defaults={
            'email': 'test_token@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )
    
    print(f"\n{'='*60}")
    print(f"Testing token generation for user: {user.email}")
    print(f"{'='*60}\n")
    
    # Get or create profile
    try:
        profile = user.profile
        print(f"✓ Profile exists: {profile}")
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user, role='viewer', email_verified=False)
        print(f"✓ Created new profile: {profile}")
    
    # Check initial state
    print(f"\nInitial state:")
    print(f"  - email_verification_token: {profile.email_verification_token}")
    print(f"  - email_verification_code: {profile.email_verification_code}")
    print(f"  - email_verification_sent_at: {profile.email_verification_sent_at}")
    print(f"  - email_verified: {profile.email_verified}")
    
    # Generate token
    print(f"\n{'='*60}")
    print("Generating verification token...")
    print(f"{'='*60}\n")
    
    try:
        token = profile.generate_verification_token()
        print(f"✓ Token generated: {token}")
        
        # Refresh from database
        profile.refresh_from_db()
        
        print(f"\nAfter generation:")
        print(f"  - email_verification_token: {profile.email_verification_token[:50]}..." if profile.email_verification_token else "  - email_verification_token: None")
        print(f"  - email_verification_code: {profile.email_verification_code}")
        print(f"  - email_verification_sent_at: {profile.email_verification_sent_at}")
        
        # Verify token was saved
        if profile.email_verification_token:
            print(f"\n✓ SUCCESS: Token was saved to database!")
            
            # Test verification
            is_valid = profile.verify_token(token)
            print(f"✓ Token verification test: {'PASSED' if is_valid else 'FAILED'}")
            
            # Test expiration
            is_expired = profile.is_token_expired()
            print(f"✓ Token expiration check: {'Expired' if is_expired else 'Valid'}")
            
        else:
            print(f"\n✗ ERROR: Token was NOT saved to database!")
            print(f"  This indicates a problem with the save() method.")
            
    except Exception as e:
        print(f"\n✗ ERROR generating token: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print(f"\n{'='*60}")
    print("Test complete!")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    test_token_generation()

