"""
Tests for users app
"""
import pytest
from django.contrib.auth.models import User
from rest_framework import status
from users.models import UserProfile


@pytest.mark.django_db
class TestUserRegistration:
    """Test user registration endpoint"""
    
    def test_register_user_success(self, api_client):
        """Test successful user registration"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'testpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = api_client.post('/api/register/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(username='newuser').exists()
        assert UserProfile.objects.filter(user__username='newuser').exists()
    
    def test_register_user_duplicate_username(self, api_client, regular_user):
        """Test registration with duplicate username"""
        data = {
            'username': 'testuser',
            'email': 'different@test.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = api_client.post('/api/register/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already exists' in response.json()['error'].lower()
    
    def test_register_user_missing_fields(self, api_client):
        """Test registration with missing required fields"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            # Missing password, first_name, last_name
        }
        response = api_client.post('/api/register/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserInfo:
    """Test user info endpoint"""
    
    def test_user_info_authenticated(self, authenticated_client, regular_user):
        """Test getting user info when authenticated"""
        response = authenticated_client.get('/api/user-info/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['username'] == 'testuser'
        assert data['email'] == 'test@test.com'
        assert data['role'] == 'viewer'
    
    def test_user_info_unauthenticated(self, api_client):
        """Test getting user info when not authenticated"""
        response = api_client.get('/api/user-info/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestJWTToken:
    """Test JWT token endpoints"""
    
    def test_token_obtain_success(self, api_client, regular_user):
        """Test successful token obtain"""
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = api_client.post('/api/token/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.json()
        assert 'refresh' in response.json()
    
    def test_token_obtain_invalid_credentials(self, api_client):
        """Test token obtain with invalid credentials"""
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        response = api_client.post('/api/token/', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_token_refresh(self, api_client, regular_user):
        """Test token refresh"""
        # First get tokens
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = api_client.post('/api/token/', data, format='json')
        refresh_token = response.json()['refresh']
        
        # Now refresh
        refresh_data = {'refresh': refresh_token}
        response = api_client.post('/api/token/refresh/', refresh_data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.json()


@pytest.mark.django_db
class TestUserManagement:
    """Test user management endpoints (admin only)"""
    
    def test_list_users_admin(self, admin_client):
        """Test listing users as admin"""
        response = admin_client.get('/api/users/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)
    
    def test_list_users_non_admin(self, authenticated_client):
        """Test listing users as non-admin (should fail)"""
        response = authenticated_client.get('/api/users/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_user_admin(self, admin_client):
        """Test creating user as admin"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'testpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'viewer',
            'is_active': True
        }
        response = admin_client.post('/api/users/create/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(username='newuser').exists()
    
    def test_get_user_admin(self, admin_client, regular_user):
        """Test getting user details as admin"""
        response = admin_client.get(f'/api/users/{regular_user.id}/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['username'] == 'testuser'


@pytest.mark.django_db
class TestMonitoredSites:
    """Test monitored sites endpoints"""
    
    def test_list_monitored_sites_authenticated(self, authenticated_client, regular_user):
        """Test listing monitored sites when authenticated"""
        response = authenticated_client.get('/api/monitor/sites/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)
    
    def test_create_monitored_site(self, authenticated_client, regular_user):
        """Test creating a monitored site"""
        data = {
            'url': 'https://example.com',
            'name': 'Example Site'
        }
        response = authenticated_client.post('/api/monitor/sites/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data['url'] == 'https://example.com'
        assert data['name'] == 'Example Site'
        assert data['user'] == regular_user.id
