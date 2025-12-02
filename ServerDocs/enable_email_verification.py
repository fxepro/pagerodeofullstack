#!/usr/bin/env python
"""
Enable email verification in site settings
"""
import os
import sys
import django

# Fix path: Script can be run from anywhere
script_path = os.path.abspath(__file__)
project_root = os.path.dirname(os.path.dirname(script_path))
backend_dir = os.path.join(project_root, 'backend')

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.chdir(backend_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from site_settings.models import SiteConfig

print("=" * 60)
print("Enabling Email Verification")
print("=" * 60)

try:
    config = SiteConfig.get_config()
    print(f"\nCurrent status: enable_email_verification = {config.enable_email_verification}")
    
    if config.enable_email_verification:
        print("\n✅ Email verification is already enabled!")
    else:
        config.enable_email_verification = True
        config.save()
        print("\n✅ Email verification has been ENABLED!")
        print(f"   New status: enable_email_verification = {config.enable_email_verification}")
        print("\n   Tokens and codes will now be generated during registration.")
        print("   Users will receive verification emails when enabled.")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)

