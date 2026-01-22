"""
Django Admin configuration for Affiliates
"""
from django.contrib import admin
from .models import Affiliate, Referral, Commission, AffiliatePayout


@admin.register(Affiliate)
class AffiliateAdmin(admin.ModelAdmin):
    list_display = [
        'affiliate_code', 'user', 'company_name', 'status', 'commission_rate',
        'total_referrals', 'total_conversions', 'total_commission_earned',
        'total_commission_pending', 'w9_completed', 'created_at'
    ]
    list_filter = ['status', 'tax_entity_type', 'w9_completed', 'created_at', 'approved_at']
    search_fields = ['affiliate_code', 'user__username', 'user__email', 'company_name', 'contact_email']
    readonly_fields = [
        'affiliate_code', 'created_at', 'updated_at', 'approved_at', 'approved_by',
        'rejected_at', 'rejected_by',
        'total_referrals', 'total_conversions', 'total_commission_earned',
        'total_commission_paid', 'total_commission_pending', 'current_year_earnings'
    ]
    
    fieldsets = (
        ('User & Identification', {
            'fields': ('user', 'affiliate_code', 'company_name', 'contact_email', 'contact_phone', 'website')
        }),
        ('Commission Settings', {
            'fields': ('commission_rate', 'commission_type', 'fixed_commission_amount')
        }),
        ('Status & Approval', {
            'fields': ('status', 'notes', 'application_notes', 'approved_at', 'approved_by', 'rejected_at', 'rejected_by', 'rejection_reason')
        }),
        ('Statistics', {
            'fields': (
                'total_referrals', 'total_conversions', 'total_commission_earned',
                'total_commission_paid', 'total_commission_pending', 'current_year_earnings'
            ),
            'classes': ('collapse',)
        }),
        ('Payout Settings', {
            'fields': ('payout_threshold', 'payout_method', 'payout_email', 'bank_account_details')
        }),
        ('Tax Information', {
            'fields': (
                'tax_entity_type', 'tax_id_type', 'tax_id_number', 'legal_name',
                'tax_address_line1', 'tax_address_line2', 'tax_city', 'tax_state',
                'tax_postal_code', 'tax_country'
            )
        }),
        ('W-9 Compliance', {
            'fields': ('w9_completed', 'w9_completed_at', 'w9_ip_address', 'last_1099_year', 'last_1099_amount')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new affiliate
            if not obj.affiliate_code:
                from .models import generate_affiliate_code
                obj.affiliate_code = generate_affiliate_code()
        super().save_model(request, obj, form, change)


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = [
        'referral_code', 'affiliate', 'referred_user', 'status',
        'signed_up_at', 'converted_at', 'created_at'
    ]
    list_filter = ['status', 'created_at', 'converted_at']
    search_fields = ['referral_code', 'affiliate__affiliate_code', 'referred_user__username', 'referred_user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Referral Information', {
            'fields': ('affiliate', 'referral_code', 'referred_user', 'status')
        }),
        ('Tracking', {
            'fields': ('ip_address', 'user_agent', 'referrer_url', 'landing_page')
        }),
        ('UTM Parameters', {
            'fields': ('utm_source', 'utm_medium', 'utm_campaign', 'cookie_expires_at')
        }),
        ('Conversion', {
            'fields': ('signed_up_at', 'converted_at', 'conversion_subscription')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Commission)
class CommissionAdmin(admin.ModelAdmin):
    list_display = [
        'affiliate', 'subscription_amount', 'commission_rate', 'commission_amount',
        'status', 'payout', 'created_at', 'approved_at'
    ]
    list_filter = ['status', 'created_at', 'approved_at', 'paid_at']
    search_fields = ['affiliate__affiliate_code', 'affiliate__user__username', 'notes']
    readonly_fields = ['created_at', 'updated_at', 'approved_at', 'approved_by', 'paid_at']
    
    fieldsets = (
        ('Commission Information', {
            'fields': ('affiliate', 'referral', 'subscription')
        }),
        ('Calculation', {
            'fields': ('subscription_amount', 'commission_rate', 'commission_amount')
        }),
        ('Status & Payout', {
            'fields': ('status', 'payout', 'paid_at', 'notes')
        }),
        ('Approval', {
            'fields': ('approved_at', 'approved_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AffiliatePayout)
class AffiliatePayoutAdmin(admin.ModelAdmin):
    list_display = [
        'affiliate', 'total_amount', 'currency', 'payout_method', 'status',
        'period_start', 'period_end', 'paid_at', 'created_at'
    ]
    list_filter = ['status', 'payout_method', 'created_at', 'paid_at']
    search_fields = ['affiliate__affiliate_code', 'affiliate__user__username', 'payout_reference', 'notes']
    readonly_fields = ['created_at', 'updated_at', 'processed_by', 'paid_at']
    
    fieldsets = (
        ('Payout Information', {
            'fields': ('affiliate', 'total_amount', 'currency')
        }),
        ('Payment Details', {
            'fields': ('payout_method', 'payout_reference', 'status', 'paid_at')
        }),
        ('Period', {
            'fields': ('period_start', 'period_end')
        }),
        ('Processing', {
            'fields': ('processed_by', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
