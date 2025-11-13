"""
Tests for site_settings app
"""
import pytest
from rest_framework import status
from site_settings.models import ColorPalette, TypographyPreset


@pytest.mark.django_db
class TestColorPalette:
    """Test color palette endpoints"""
    
    def test_list_palettes_authenticated(self, authenticated_client):
        """Test listing color palettes when authenticated"""
        response = authenticated_client.get('/api/palettes/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)
    
    def test_get_active_palette(self, authenticated_client):
        """Test getting active palette"""
        response = authenticated_client.get('/api/palettes/active/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'id' in data or 'name' in data


@pytest.mark.django_db
class TestTypographyPreset:
    """Test typography preset endpoints"""
    
    def test_list_typography_presets_authenticated(self, authenticated_client):
        """Test listing typography presets when authenticated"""
        response = authenticated_client.get('/api/typography/')
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)
    
    def test_get_active_typography(self, authenticated_client):
        """Test getting active typography preset"""
        response = authenticated_client.get('/api/typography/active/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'id' in data or 'name' in data

