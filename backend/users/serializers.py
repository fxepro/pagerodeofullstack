from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile,
    UserActivity,
    UserCorporateProfile,
    PaymentMethod,
    UserSubscription,
    BillingTransaction,
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


class PaymentMethodSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        """Safely serialize payment method, handling missing fields gracefully"""
        try:
            data = super().to_representation(instance)
        except Exception as e:
            # If serialization fails due to missing fields, build data manually
            # This handles cases where migration hasn't been run yet
            data = {
                'id': instance.id,
                'nickname': instance.nickname,
                'method_type': instance.method_type,
                'brand': getattr(instance, 'brand', ''),
                'last4': getattr(instance, 'last4', ''),
                'exp_month': getattr(instance, 'exp_month', None),
                'exp_year': getattr(instance, 'exp_year', None),
                'bank_name': getattr(instance, 'bank_name', ''),
                'account_type': getattr(instance, 'account_type', ''),
                'is_default': instance.is_default,
                'created_at': instance.created_at,
            }
        
        # Safely get new field values, defaulting to empty string if field doesn't exist
        # This handles cases where migration hasn't been run yet
        new_fields = [
            # Card fields
            'cardholder_name', 'card_number',
            'billing_address_line1', 'billing_address_line2',
            'billing_city', 'billing_state', 'billing_postal_code', 'billing_country',
            # ACH fields
            'account_number', 'routing_number',
            'bank_address_line1', 'bank_address_line2',
            'bank_city', 'bank_state', 'bank_postal_code', 'bank_country',
        ]
        
        # Update data with safe field values
        for field in new_fields:
            if field not in data:
                try:
                    value = getattr(instance, field, '')
                    data[field] = value if value is not None else ''
                except (AttributeError, Exception):
                    data[field] = ''
        
        return data
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id',
            'nickname',
            'method_type',
            # Card fields
            'cardholder_name',
            'card_number',
            'brand',
            'last4',
            'exp_month',
            'exp_year',
            'billing_address_line1',
            'billing_address_line2',
            'billing_city',
            'billing_state',
            'billing_postal_code',
            'billing_country',
            # ACH fields
            'bank_name',
            'account_type',
            'account_number',
            'routing_number',
            'bank_address_line1',
            'bank_address_line2',
            'bank_city',
            'bank_state',
            'bank_postal_code',
            'bank_country',
            'is_default',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class UserSubscriptionSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        """Safely serialize subscription, handling missing fields gracefully"""
        try:
            data = super().to_representation(instance)
        except Exception as e:
            # If serialization fails due to missing fields, build data manually
            # This handles cases where migration hasn't been run yet
            data = {
                'id': instance.id,
                'plan_name': instance.plan_name,
                'role': instance.role,
                'start_date': instance.start_date.isoformat() if instance.start_date else None,
                'end_date': instance.end_date.isoformat() if instance.end_date else None,
                'is_recurring': instance.is_recurring,
                'status': instance.status,
                'notes': instance.notes,
                'created_at': instance.created_at.isoformat() if instance.created_at else None,
                'updated_at': instance.updated_at.isoformat() if instance.updated_at else None,
            }
        
        # Safely get new field values, defaulting to None if field doesn't exist
        new_fields = [
            'price_monthly', 'price_yearly', 'billing_period', 'discount_code'
        ]
        
        # Update data with safe field values
        for field in new_fields:
            if field not in data:
                try:
                    value = getattr(instance, field, None)
                    if field in ['price_monthly', 'price_yearly']:
                        # Convert Decimal to string for JSON serialization
                        data[field] = str(value) if value is not None else None
                    elif field == 'billing_period':
                        data[field] = value if value else 'monthly'
                    else:
                        data[field] = value if value else ''
                except (AttributeError, Exception):
                    # Field doesn't exist in database yet
                    if field in ['price_monthly', 'price_yearly']:
                        data[field] = None
                    elif field == 'billing_period':
                        data[field] = 'monthly'
                    else:
                        data[field] = ''
        
        # Ensure Decimal fields are strings for JSON
        if data.get('price_monthly') is not None and not isinstance(data['price_monthly'], str):
            data['price_monthly'] = str(data['price_monthly'])
        if data.get('price_yearly') is not None and not isinstance(data['price_yearly'], str):
            data['price_yearly'] = str(data['price_yearly'])
        
        return data
    
    class Meta:
        model = UserSubscription
        fields = [
            'id',
            'plan_name',
            'role',
            'price_monthly',
            'price_yearly',
            'billing_period',
            'discount_code',
            'start_date',
            'end_date',
            'is_recurring',
            'status',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']


class BillingTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingTransaction
        fields = [
            'id',
            'amount',
            'currency',
            'description',
            'invoice_id',
            'status',
            'metadata',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'metadata', 'created_at']


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
