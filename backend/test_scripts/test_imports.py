import os
import sys

print("="*70)
print("TESTING DJANGO IMPORTS")
print("="*70)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

print("\n1. Testing Django setup...")
try:
    import django
    django.setup()
    print("   ✓ Django setup successful")
except Exception as e:
    print(f"   ✗ Django setup failed: {e}")
    sys.exit(1)

print("\n2. Testing core.urls import...")
try:
    from core import urls as core_urls
    print(f"   ✓ core.urls imported")
    print(f"   - Total URL patterns: {len(core_urls.urlpatterns)}")
except Exception as e:
    print(f"   ✗ Failed to import core.urls: {e}")
    import traceback
    traceback.print_exc()

print("\n3. Testing users.urls import...")
try:
    from users import urls as users_urls
    print(f"   ✓ users.urls imported")
    print(f"   - Total URL patterns: {len(users_urls.urlpatterns)}")
    for pattern in users_urls.urlpatterns:
        print(f"     - {pattern.pattern}")
except Exception as e:
    print(f"   ✗ Failed to import users.urls: {e}")
    import traceback
    traceback.print_exc()

print("\n4. Testing users.views import...")
try:
    from users import views
    print(f"   ✓ users.views imported")
    print(f"   - Has user_info function: {hasattr(views, 'user_info')}")
except Exception as e:
    print(f"   ✗ Failed to import users.views: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*70)


