import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from users.models import UserProfile

# Check if any users exist
user_count = User.objects.count()
print(f"Current number of users in database: {user_count}")

if user_count > 0:
    print("\nExisting users:")
    for user in User.objects.all():
        print(f"  - Username: {user.username}, Email: {user.email}, Superuser: {user.is_superuser}")
        try:
            profile = user.profile
            print(f"    Role: {profile.role}, Active: {profile.is_active}")
        except:
            print(f"    No profile found")
    print("\n" + "="*50)

# Create test admin user if none exists
if not User.objects.filter(username='admin').exists():
    print("\nCreating test admin user...")
    user = User.objects.create_superuser(
        username='admin',
        email='admin@pagerodeo.com',
        password='admin123'
    )
    print(f"✓ Created superuser: admin / admin123")
    
    # Create profile
    try:
        profile = UserProfile.objects.create(
            user=user,
            role='admin',
            is_active=True
        )
        print(f"✓ Created profile for admin user")
    except Exception as e:
        print(f"Profile creation note: {e}")
else:
    print("\n⚠ Admin user already exists")
    admin = User.objects.get(username='admin')
    print(f"  Username: admin")
    print(f"  Email: {admin.email}")
    print(f"  Is active: {admin.is_active}")
    print(f"  Is superuser: {admin.is_superuser}")

# Create test regular user if none exists
if not User.objects.filter(username='testuser').exists():
    print("\nCreating test regular user...")
    user = User.objects.create_user(
        username='testuser',
        email='test@pagerodeo.com',
        password='test123'
    )
    print(f"✓ Created user: testuser / test123")
    
    # Create profile
    try:
        profile = UserProfile.objects.create(
            user=user,
            role='viewer',
            is_active=True
        )
        print(f"✓ Created profile for test user")
    except Exception as e:
        print(f"Profile creation note: {e}")
else:
    print("\n⚠ Test user already exists")

print("\n" + "="*50)
print("TEST CREDENTIALS:")
print("="*50)
print("Admin Login:")
print("  Username: admin")
print("  Password: admin123")
print("\nRegular User Login:")
print("  Username: testuser")
print("  Password: test123")
print("="*50)


