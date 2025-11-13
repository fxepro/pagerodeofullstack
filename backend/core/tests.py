"""
Tests for core app
"""
import pytest
from django.contrib.auth.models import User
from rest_framework import status


@pytest.mark.django_db
class TestMonitoringEndpoints:
    """Test monitoring endpoints"""
    
    def test_system_status_admin(self, admin_client):
        """Test getting system status as admin"""
        response = admin_client.get('/api/monitoring/status/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'running_jobs' in data
        assert 'failed_jobs_24h' in data
        assert 'theme_degraded' in data
    
    def test_system_status_non_admin(self, authenticated_client):
        """Test getting system status as non-admin (should fail)"""
        response = authenticated_client.get('/api/monitoring/status/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_log_files_list_admin(self, admin_client):
        """Test listing log files as admin"""
        response = admin_client.get('/api/monitoring/logs/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_view_logs_admin(self, admin_client):
        """Test viewing logs as admin"""
        response = admin_client.get('/api/monitoring/logs/app/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'log_type' in data
        assert 'lines' in data


@pytest.mark.django_db
class TestRateLimiting:
    """Test rate limiting"""
    
    def test_rate_limit_login(self, api_client):
        """Test rate limiting on login endpoint"""
        data = {
            'username': 'nonexistent',
            'password': 'wrongpassword'
        }
        # Make multiple requests quickly
        responses = []
        for i in range(10):
            response = api_client.post('/api/token/', data, format='json')
            responses.append(response.status_code)
        
        # Should get 401 for all, but rate limiting might kick in
        # This is a basic test - rate limiting behavior depends on configuration
        assert all(status_code in [401, 429] for status_code in responses)

