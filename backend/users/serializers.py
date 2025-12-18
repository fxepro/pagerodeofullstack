from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile,
    UserActivity,
    UserCorporateProfile,
    MonitoredSite,
)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'role', 'is_active', 'created_at', 'updated_at', 'last_login', 'login_count',
            'phone', 'bio', 'avatar_url', 'date_of_birth', 'timezone', 'locale', 'user_settings'
        ]
        read_only_fields = ['created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    role = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    last_login = serializers.SerializerMethodField()
    email_verified = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'last_login', 'role', 'is_active', 'email_verified', 'profile']
        read_only_fields = ['id', 'date_joined']
    
    def get_role(self, obj):
        # Get role from profile first (source of truth)
        try:
            return obj.profile.role
        except UserProfile.DoesNotExist:
            # If no profile exists, check if superuser
            if obj.is_superuser:
                return 'admin'
            return 'viewer'  # Default role
    
    def get_is_active(self, obj):
        # Check if user is active in Django User model
        if not obj.is_active:
            return False
        # Check if user is active in profile
        try:
            return obj.profile.is_active
        except UserProfile.DoesNotExist:
            return True  # Default to active
    
    def get_last_login(self, obj):
        # Get last login from profile if available, otherwise from User model
        try:
            return obj.profile.last_login or obj.last_login
        except UserProfile.DoesNotExist:
            return obj.last_login
    
    def get_email_verified(self, obj):
        # Get email_verified status from profile
        try:
            return obj.profile.email_verified
        except UserProfile.DoesNotExist:
            return False

class UserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = ['action', 'description', 'ip_address', 'user_agent', 'timestamp']


class UserCorporateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserCorporateProfile
        fields = [
            'company_name',
            'job_title',
            'phone',
            'website',
            'tax_id',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'postal_code',
            'country',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class MonitoredSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitoredSite
        fields = [
            'id',
            'user',
            'url',
            'status',
            'uptime',
            'last_check',
            'response_time',
            'status_duration',
            'check_interval',
            'ssl_valid',
            'ssl_expires_in',
            'error_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class MonitoredSiteUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitoredSite
        fields = [
            'status',
            'uptime',
            'last_check',
            'response_time',
            'status_duration',
            'check_interval',
            'ssl_valid',
            'ssl_expires_in',
            'error_message',
        ]


