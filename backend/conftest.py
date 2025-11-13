"""
Pytest configuration and fixtures for Django tests
"""
import pytest
from django.contrib.auth.models import User
from users.models import UserProfile
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.fixture
def api_client():
    """API client fixture for testing"""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Create an admin user for testing"""
    user = User.objects.create_user(
        username='admin',
        email='admin@test.com',
        password='testpass123',
        is_superuser=True,
        is_staff=True
    )
    UserProfile.objects.create(
        user=user,
        role='admin',
        is_active=True
    )
    return user


@pytest.fixture
def regular_user(db):
    """Create a regular user for testing"""
    user = User.objects.create_user(
        username='testuser',
        email='test@test.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )
    UserProfile.objects.create(
        user=user,
        role='viewer',
        is_active=True
    )
    return user


@pytest.fixture
def authenticated_client(api_client, regular_user):
    """API client authenticated as regular user"""
    refresh = RefreshToken.for_user(regular_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """API client authenticated as admin user"""
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

