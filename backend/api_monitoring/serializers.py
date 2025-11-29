"""
Serializers for Admin API Monitoring
"""

from rest_framework import serializers
from .models import APIEndpoint, APICheck, APIAlert
from .utils import detect_context_from_url


class APIEndpointSerializer(serializers.ModelSerializer):
    last_check_status = serializers.SerializerMethodField()
    context = serializers.SerializerMethodField()
    
    class Meta:
        model = APIEndpoint
        fields = [
            'id', 'name', 'url', 'method', 'expected_status_code',
            'timeout_seconds', 'check_interval_minutes', 'is_active',
            'requires_auth', 'auth_token', 'headers', 'body',
            'created_at', 'updated_at', 'last_check_status', 'context'
        ]
        read_only_fields = ['created_at', 'updated_at', 'last_check_status', 'context']
    
    def get_last_check_status(self, obj):
        last_check = obj.checks.order_by('-checked_at').first()
        if last_check:
            return {
                'status_code': last_check.status_code,
                'response_time_ms': last_check.response_time_ms,
                'is_success': last_check.is_success,
                'checked_at': last_check.checked_at
            }
        return None
    
    def get_context(self, obj):
        """Auto-detect context from URL"""
        return detect_context_from_url(obj.url)


class APICheckSerializer(serializers.ModelSerializer):
    endpoint_name = serializers.CharField(source='endpoint.name', read_only=True)
    endpoint_url = serializers.CharField(source='endpoint.url', read_only=True)
    
    class Meta:
        model = APICheck
        fields = [
            'id', 'endpoint', 'endpoint_name', 'endpoint_url',
            'status_code', 'response_time_ms', 'is_success',
            'response_body', 'error_message', 'checked_at'
        ]
        read_only_fields = ['id', 'checked_at']


class APIAlertSerializer(serializers.ModelSerializer):
    endpoint_name = serializers.CharField(source='endpoint.name', read_only=True)
    endpoint_url = serializers.CharField(source='endpoint.url', read_only=True)
    
    class Meta:
        model = APIAlert
        fields = [
            'id', 'endpoint', 'endpoint_name', 'endpoint_url',
            'api_check', 'alert_type', 'message',
            'is_resolved', 'resolved_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

