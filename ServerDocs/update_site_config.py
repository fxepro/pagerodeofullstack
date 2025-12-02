#!/usr/bin/env python
"""
Update site config to match CSV data - sets enable_email_verification to True
"""
import os
import sys
import django

# Fix path
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
print("Updating Site Config to Match CSV Data")
print("=" * 60)

try:
    config = SiteConfig.get_config()
    
    print(f"\n[1] Current state:")
    print(f"   enable_email_verification: {config.enable_email_verification}")
    
    # Update to match CSV
    print(f"\n[2] Updating config...")
    config.site_name = 'PAGERODEO'
    config.site_description = 'A comprehensive web performance monitoring and analysis platform'
    config.default_language = 'en'
    config.default_theme = 'light'
    config.session_timeout_minutes = 30
    config.max_login_attempts = 5
    config.require_strong_passwords = True
    config.enable_two_factor = False
    config.enable_email_verification = True  # KEY CHANGE
    config.enable_email_notifications = True
    config.enable_push_notifications = True
    config.enable_sms_notifications = False
    config.notification_email = 'admin@pagerodeo.com'
    config.api_base_url = 'http://localhost:8000'
    config.api_rate_limit = 1000
    config.enable_cors = True
    config.enable_api_docs = True
    config.enable_analytics = False
    
    # Note: active_palette_id and active_typography_id need to exist
    # Skip if they don't exist to avoid errors
    
    config.save()
    
    # Verify
    config.refresh_from_db()
    print(f"\n[3] After update:")
    print(f"   enable_email_verification: {config.enable_email_verification}")
    print(f"   enable_two_factor: {config.enable_two_factor}")
    print(f"   require_strong_passwords: {config.require_strong_passwords}")
    print(f"   enable_analytics: {config.enable_analytics}")
    
    if config.enable_email_verification:
        print("\n   ✅✅✅ SUCCESS! Email verification is now ENABLED!")
    else:
        print("\n   ❌ FAILED! Email verification is still disabled!")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)

