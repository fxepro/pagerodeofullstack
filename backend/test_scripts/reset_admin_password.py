import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from users.models import UserProfile

print("="*60)
print("RESET ADMIN PASSWORD")
print("="*60)

# Get or create admin user
try:
    admin = User.objects.get(username='admin')
    print(f"\n✓ Found existing admin user")
except User.DoesNotExist:
    print(f"\nCreating new admin user...")
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@pagerodeo.com',
        password='admin123'
    )
    print(f"✓ Created admin user")

# Reset password
admin.set_password('admin123')
admin.is_active = True
admin.is_superuser = True
admin.save()

print(f"\n✓ Password reset to: admin123")
print(f"✓ User is active: {admin.is_active}")
print(f"✓ User is superuser: {admin.is_superuser}")

# Ensure profile exists
try:
    profile = admin.profile
    print(f"✓ Profile exists - Role: {profile.role}")
except UserProfile.DoesNotExist:
    profile = UserProfile.objects.create(
        user=admin,
        role='admin',
        is_active=True
    )
    print(f"✓ Created profile - Role: admin")

print("\n" + "="*60)
print("LOGIN CREDENTIALS:")
print("="*60)
print("Username: admin")
print("Password: admin123")
print("="*60)
print("\nYou can now login at: http://localhost:3000/login")


