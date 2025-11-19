#!/usr/bin/env python
"""
Script to check email verification configuration and test email sending
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
from site_settings.models import SiteConfig
from django.core.mail import send_mail
from django.contrib.auth.models import User

def check_config():
    """Check email verification configuration"""
    print("=" * 60)
    print("Email Verification Configuration Check")
    print("=" * 60)
    
    # Check SiteConfig
    try:
        config = SiteConfig.get_config()
        print(f"\n1. SiteConfig:")
        print(f"   - Email verification enabled: {config.enable_email_verification}")
        print(f"   - Two-factor enabled: {config.enable_two_factor}")
        
        if not config.enable_email_verification:
            print("\n   ⚠️  WARNING: Email verification is DISABLED in SiteConfig")
            print("   → Enable it via Django Admin or /admin/settings")
    except Exception as e:
        print(f"\n   ❌ ERROR: Could not load SiteConfig: {e}")
    
    # Check email settings
    print(f"\n2. Email Settings:")
    print(f"   - EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"   - EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"   - EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"   - EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"   - EMAIL_HOST_USER: {settings.EMAIL_HOST_USER or '(empty)'}")
    print(f"   - EMAIL_HOST_PASSWORD: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else '(empty)'}")
    print(f"   - DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL or '(empty)'}")
    print(f"   - SERVER_EMAIL: {settings.SERVER_EMAIL or '(empty)'}")
    
    # Validate email settings
    issues = []
    if not settings.EMAIL_HOST_USER:
        issues.append("EMAIL_HOST_USER is not set")
    if not settings.EMAIL_HOST_PASSWORD:
        issues.append("EMAIL_HOST_PASSWORD is not set")
    if not settings.DEFAULT_FROM_EMAIL:
        issues.append("DEFAULT_FROM_EMAIL is not set")
    
    if issues:
        print(f"\n   ⚠️  WARNING: Email configuration issues:")
        for issue in issues:
            print(f"      - {issue}")
    else:
        print(f"\n   ✅ Email configuration looks OK")
    
    # Test email sending
    print(f"\n3. Test Email Sending:")
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        print("   ⚠️  Skipping test - email credentials not configured")
        return
    
    test_email = input("   Enter test email address (or press Enter to skip): ").strip()
    if not test_email:
        print("   Skipped test email")
        return
    
    try:
        print(f"   Sending test email to {test_email}...")
        send_mail(
            subject="Test Email from PageRodeo",
            message="This is a test email from PageRodeo. If you receive this, email is working!",
            from_email=settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER,
            recipient_list=[test_email],
            fail_silently=False,
        )
        print(f"   ✅ Test email sent successfully!")
    except Exception as e:
        print(f"   ❌ ERROR sending test email: {e}")
        print(f"   → Check your email credentials and SMTP settings")
    
    # Check recent unverified users
    print(f"\n4. Recent Unverified Users:")
    try:
        from users.models import UserProfile
        unverified = UserProfile.objects.filter(email_verified=False).select_related('user')[:5]
        if unverified:
            print(f"   Found {unverified.count()} unverified users:")
            for profile in unverified:
                print(f"   - {profile.user.email} (created: {profile.user.date_joined})")
        else:
            print("   No unverified users found")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")

if __name__ == '__main__':
    check_config()

