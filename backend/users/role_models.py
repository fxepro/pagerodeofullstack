from django.db import models
from django.contrib.auth.models import User, Permission as DjangoPermission, Group

# Use Django's Group model as Role
Role = Group

def get_role_user_count(role):
    """Get number of users with this role"""
    from .models import UserProfile
    return UserProfile.objects.filter(role=role.name).count()

# Add custom method to Group model
Group.add_to_class('get_user_count', get_role_user_count)

