"""
DRF Serializers for Affiliates
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Affiliate, Referral, Commission, AffiliatePayout


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for affiliate relationships"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'first_name', 'last_name']
        read_only_fields = ['id', 'username', 'email']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class AffiliateSerializer(serializers.ModelSerializer):
    """Serializer for Affiliate model"""
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    referral_url = serializers.SerializerMethodField()
    can_request_payout = serializers.SerializerMethodField()
    
    class Meta:
        model = Affiliate
        fields = [
            'id', 'user', 'user_id', 'affiliate_code', 'company_name', 'contact_email', 
            'contact_phone', 'website', 'commission_rate', 'commission_type', 
            'fixed_commission_amount', 'status', 'notes', 'application_notes', 'total_referrals', 
            'total_conversions', 'total_commission_earned', 'total_commission_paid',
            'total_commission_pending', 'payout_threshold', 'payout_method', 
            'payout_email', 'bank_account_details', 'tax_entity_type', 'tax_id_type',
            'tax_id_number', 'legal_name', 'tax_address_line1', 'tax_address_line2',
            'tax_city', 'tax_state', 'tax_postal_code', 'tax_country', 'w9_completed',
            'w9_completed_at', 'current_year_earnings', 'last_1099_year', 
            'last_1099_amount', 'created_at', 'updated_at', 'approved_at',
            'approved_by', 'rejected_at', 'rejected_by', 'rejection_reason',
            'referral_url', 'can_request_payout'
        ]
        read_only_fields = [
            'id', 'affiliate_code', 'created_at', 'updated_at', 'total_referrals',
            'total_conversions', 'total_commission_earned', 'total_commission_paid',
            'total_commission_pending', 'current_year_earnings', 'approved_at', 'approved_by',
            'rejected_at', 'rejected_by'
        ]
    
    def get_referral_url(self, obj):
        request = self.context.get('request')
        base_url = request.build_absolute_uri('/')[:-1] if request else 'https://pagerodeo.com'
        return obj.get_referral_url(base_url)
    
    def get_can_request_payout(self, obj):
        return obj.can_request_payout()
    
    def create(self, validated_data):
        user_id = validated_data.pop('user_id', None)
        if user_id:
            validated_data['user'] = User.objects.get(id=user_id)
        elif 'user' not in validated_data:
            # Use request user if not provided
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                validated_data['user'] = request.user
        return super().create(validated_data)


class ReferralSerializer(serializers.ModelSerializer):
    """Serializer for Referral model"""
    affiliate = AffiliateSerializer(read_only=True)
    affiliate_id = serializers.IntegerField(write_only=True, required=False)
    referred_user = UserSerializer(read_only=True)
    referred_user_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Referral
        fields = [
            'id', 'affiliate', 'affiliate_id', 'referral_code', 'referred_user',
            'referred_user_id', 'ip_address', 'user_agent', 'referrer_url',
            'landing_page', 'status', 'signed_up_at', 'converted_at',
            'conversion_subscription', 'utm_source', 'utm_medium', 'utm_campaign',
            'cookie_expires_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        affiliate_id = validated_data.pop('affiliate_id', None)
        if affiliate_id:
            validated_data['affiliate'] = Affiliate.objects.get(id=affiliate_id)
        
        referred_user_id = validated_data.pop('referred_user_id', None)
        if referred_user_id:
            validated_data['referred_user'] = User.objects.get(id=referred_user_id)
        
        return super().create(validated_data)


class CommissionSerializer(serializers.ModelSerializer):
    """Serializer for Commission model"""
    affiliate = AffiliateSerializer(read_only=True)
    affiliate_id = serializers.IntegerField(write_only=True, required=False)
    referral = ReferralSerializer(read_only=True)
    referral_id = serializers.IntegerField(write_only=True, required=False)
    subscription_id = serializers.IntegerField(write_only=True, required=False)
    approved_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Commission
        fields = [
            'id', 'affiliate', 'affiliate_id', 'referral', 'referral_id',
            'subscription', 'subscription_id', 'subscription_amount', 'commission_rate',
            'commission_amount', 'status', 'payout', 'paid_at', 'notes',
            'created_at', 'updated_at', 'approved_at', 'approved_by'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'approved_at', 'approved_by', 'paid_at'
        ]
    
    def create(self, validated_data):
        affiliate_id = validated_data.pop('affiliate_id', None)
        if affiliate_id:
            validated_data['affiliate'] = Affiliate.objects.get(id=affiliate_id)
        
        referral_id = validated_data.pop('referral_id', None)
        if referral_id:
            validated_data['referral'] = Referral.objects.get(id=referral_id)
        
        subscription_id = validated_data.pop('subscription_id', None)
        if subscription_id:
            from financials.models import UserSubscription
            validated_data['subscription'] = UserSubscription.objects.get(id=subscription_id)
        
        return super().create(validated_data)


class AffiliatePayoutSerializer(serializers.ModelSerializer):
    """Serializer for AffiliatePayout model"""
    affiliate = AffiliateSerializer(read_only=True)
    affiliate_id = serializers.IntegerField(write_only=True, required=False)
    processed_by = UserSerializer(read_only=True)
    commission_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AffiliatePayout
        fields = [
            'id', 'affiliate', 'affiliate_id', 'total_amount', 'currency',
            'payout_method', 'payout_reference', 'status', 'paid_at',
            'period_start', 'period_end', 'notes', 'created_at', 'updated_at',
            'processed_by', 'commission_count'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'processed_by', 'paid_at'
        ]
    
    def get_commission_count(self, obj):
        return obj.commissions.count()
    
    def create(self, validated_data):
        affiliate_id = validated_data.pop('affiliate_id', None)
        if affiliate_id:
            validated_data['affiliate'] = Affiliate.objects.get(id=affiliate_id)
        return super().create(validated_data)


class AffiliateStatsSerializer(serializers.Serializer):
    """Serializer for affiliate statistics"""
    total_affiliates = serializers.IntegerField()
    active_affiliates = serializers.IntegerField()
    pending_affiliates = serializers.IntegerField()
    total_referrals = serializers.IntegerField()
    total_conversions = serializers.IntegerField()
    conversion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_commissions_earned = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_commissions_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_commissions_pending = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_payouts_count = serializers.IntegerField()
    pending_payouts_amount = serializers.DecimalField(max_digits=10, decimal_places=2)

