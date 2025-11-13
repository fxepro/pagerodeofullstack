import os
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate

print("="*60)
print("LOGIN DIAGNOSTIC TEST")
print("="*60)

# Test 1: Check if admin user exists
print("\n1. Checking if admin user exists in database...")
try:
    admin = User.objects.get(username='admin')
    print(f"   ✓ Found user: {admin.username}")
    print(f"   - Email: {admin.email}")
    print(f"   - Is active: {admin.is_active}")
    print(f"   - Is superuser: {admin.is_superuser}")
    print(f"   - Has usable password: {admin.has_usable_password()}")
except User.DoesNotExist:
    print("   ✗ Admin user does not exist!")
    print("   Run: python manage.py createsuperuser")
    exit()

# Test 2: Test Django authenticate
print("\n2. Testing Django authenticate() with password 'admin123'...")
user = authenticate(username='admin', password='admin123')
if user:
    print(f"   ✓ Authentication successful!")
    print(f"   - User: {user.username}")
    print(f"   - Active: {user.is_active}")
else:
    print("   ✗ Authentication FAILED!")
    print("   The password 'admin123' is incorrect for user 'admin'")
    print("\n   To reset password, run:")
    print("   python manage.py shell")
    print("   >>> from django.contrib.auth.models import User")
    print("   >>> user = User.objects.get(username='admin')")
    print("   >>> user.set_password('admin123')")
    print("   >>> user.save()")
    print("   >>> exit()")

# Test 3: Test API endpoint
print("\n3. Testing JWT token endpoint at http://localhost:8000/api/token/...")
try:
    response = requests.post(
        'http://localhost:8000/api/token/',
        json={'username': 'admin', 'password': 'admin123'},
        timeout=5
    )
    print(f"   Status Code: {response.status_code}")
    if response.status_code == 200:
        print("   ✓ Token endpoint working!")
        data = response.json()
        print(f"   - Access token: {data.get('access', 'N/A')[:50]}...")
        print(f"   - Refresh token: {data.get('refresh', 'N/A')[:50]}...")
    else:
        print(f"   ✗ Token endpoint failed!")
        print(f"   Response: {response.text}")
except requests.exceptions.ConnectionError:
    print("   ✗ Cannot connect to http://localhost:8000")
    print("   Is the Django server running?")
    print("   Run: python manage.py runserver")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 4: Check user-info endpoint
print("\n4. Testing user-info endpoint...")
try:
    # First get token
    token_response = requests.post(
        'http://localhost:8000/api/token/',
        json={'username': 'admin', 'password': 'admin123'},
        timeout=5
    )
    if token_response.status_code == 200:
        token = token_response.json()['access']
        
        # Now test user-info
        info_response = requests.get(
            'http://localhost:8000/api/user-info/',
            headers={'Authorization': f'Bearer {token}'},
            timeout=5
        )
        print(f"   Status Code: {info_response.status_code}")
        if info_response.status_code == 200:
            print("   ✓ User info endpoint working!")
            data = info_response.json()
            print(f"   - Username: {data.get('username')}")
            print(f"   - Role: {data.get('role')}")
        else:
            print(f"   ✗ User info endpoint failed!")
            print(f"   Response: {info_response.text}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n" + "="*60)
print("SUMMARY")
print("="*60)
print("If all tests passed, login should work at http://localhost:3000/login")
print("Use: admin / admin123")
print("="*60)


