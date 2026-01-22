from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    PaymentMethod,
    UserSubscription,
    BillingTransaction,
    CoinbaseCharge,
    CoinbaseTransaction,
    PaymentProviderConfig,
    SubscriptionPlan,
    BillingAddress,
)


class PaymentMethodSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        """Safely serialize payment method, handling missing fields gracefully"""
        try:
            data = super().to_representation(instance)
        except Exception as e:
            # If serialization fails due to missing fields, build data manually
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
            'paypal_subscription_id',
            'paypal_plan_id',
            'paypal_product_id',
            'next_billing_date',
            'paypal_status',
            'cancelled_at',
            'cancellation_reason',
            'promotional_deal',
            'deal_redeemed_at',
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
            'payment_provider',
            'paypal_transaction_id',
            'paypal_sale_id',
            'paypal_payment_id',
            'subscription',
            'transaction_type',
            'processed_at',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'metadata', 'created_at']


class CoinbaseChargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinbaseCharge
        fields = [
            'id', 'user', 'subscription', 'charge_id', 'charge_code', 'hosted_url',
            'name', 'description', 'amount_usd', 'currency', 'status', 'pricing_type',
            'redirect_url', 'cancel_url', 'metadata', 'created_at', 'updated_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CoinbaseTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinbaseTransaction
        fields = [
            'id', 'user', 'subscription', 'charge', 'transaction_id', 'crypto_currency',
            'crypto_amount', 'amount_usd', 'exchange_rate', 'network', 'transaction_hash',
            'block_height', 'confirmations', 'status', 'payment_method', 'timeline',
            'processed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentProviderConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentProviderConfig
        fields = [
            'id', 'provider', 'client_id', 'client_secret', 'webhook_id', 'webhook_url',
            'webhook_secret', 'is_active', 'is_live', 'config', 'created_at', 'updated_at', 'last_sync_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_sync_at']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'plan_name', 'display_name', 'description', 'price_monthly', 'price_yearly',
            'paypal_plan_id_monthly', 'paypal_plan_id_annual', 'paypal_product_id',
            'stripe_plan_id_monthly', 'stripe_plan_id_annual',
            'coinbase_plan_id_monthly', 'coinbase_plan_id_annual',
            'is_active', 'is_featured', 'role', 'display_order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BillingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingAddress
        fields = [
            'id', 'user', 'subscription', 'first_name', 'last_name', 'email', 'phone',
            'company_name', 'tax_id', 'address_line1', 'address_line2', 'city', 'state',
            'postal_code', 'country', 'payment_provider', 'provider_address_id',
            'is_default', 'is_active', 'created_at', 'updated_at', 'last_used_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_used_at']

