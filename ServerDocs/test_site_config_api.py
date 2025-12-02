#!/usr/bin/env python
"""
Test the site config API to verify enable_email_verification is saved correctly
"""
import os
import sys
import django
import requests

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
from django.contrib.auth.models import User

print("=" * 60)
print("Testing Site Config API")
print("=" * 60)

# Get current config
config = SiteConfig.get_config()
print(f"\n[1] Current config state:")
print(f"   enable_email_verification: {config.enable_email_verification}")

# Test direct model update
print(f"\n[2] Testing direct model update...")
config.enable_email_verification = True
config.save()
config.refresh_from_db()
print(f"   After direct save: {config.enable_email_verification}")

# Reset for API test
config.enable_email_verification = False
config.save()

# Test serializer
print(f"\n[3] Testing serializer...")
from site_settings.serializers import SiteConfigSerializer

serializer = SiteConfigSerializer(
    config,
    data={'enable_email_verification': True},
    partial=True
)

if serializer.is_valid():
    print(f"   ✅ Serializer valid")
    print(f"   Validated data: {serializer.validated_data}")
    serializer.save()
    config.refresh_from_db()
    print(f"   After serializer save: {config.enable_email_verification}")
else:
    print(f"   ❌ Serializer errors: {serializer.errors}")

print("\n" + "=" * 60)
print("Test complete!")
print("=" * 60)
print("\nTo test via API, you need:")
print("1. Admin user token")
print("2. Run: curl -X PATCH http://localhost:8000/api/site-config/update/ \\")
print("   -H 'Authorization: Bearer YOUR_TOKEN' \\")
print("   -H 'Content-Type: application/json' \\")
print("   -d '{\"enable_email_verification\": true}'")

