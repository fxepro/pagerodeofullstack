from django.contrib import admin
from .models import (
    PaymentMethod,
    UserSubscription,
    BillingTransaction,
    PaymentProviderConfig,
    SubscriptionPlan,
    BillingAddress,
    CoinbaseCharge,
    CoinbaseTransaction,
)


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ("user", "method_type", "nickname", "is_default", "created_at")
    list_filter = ("method_type", "is_default")
    search_fields = ("user__username", "nickname", "brand", "bank_name")


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan_name", "status", "start_date", "end_date", "is_recurring", "billing_period")
    list_filter = ("status", "is_recurring", "plan_name", "billing_period")
    search_fields = ("user__username", "plan_name", "role", "paypal_subscription_id")
    readonly_fields = ("created_at", "updated_at")


@admin.register(BillingTransaction)
class BillingTransactionAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "currency", "status", "payment_provider", "transaction_type", "created_at")
    list_filter = ("status", "payment_provider", "transaction_type", "currency")
    search_fields = ("user__username", "paypal_transaction_id", "invoice_id", "description")
    readonly_fields = ("created_at",)


@admin.register(PaymentProviderConfig)
class PaymentProviderConfigAdmin(admin.ModelAdmin):
    list_display = ("provider", "is_active", "is_live", "created_at", "updated_at")
    list_filter = ("provider", "is_active", "is_live")
    readonly_fields = ("created_at", "updated_at", "last_sync_at")
    fieldsets = (
        ('Provider Information', {
            'fields': ('provider', 'is_active', 'is_live')
        }),
        ('Credentials', {
            'fields': ('client_id', 'client_secret'),
            'classes': ('collapse',)
        }),
        ('Webhook Configuration', {
            'fields': ('webhook_id', 'webhook_url', 'webhook_secret'),
            'classes': ('collapse',)
        }),
        ('Additional Config', {
            'fields': ('config',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_sync_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ("plan_name", "display_name", "price_monthly", "price_yearly", "is_active", "is_featured", "role")
    list_filter = ("is_active", "is_featured", "role")
    search_fields = ("plan_name", "display_name", "description")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ('Plan Information', {
            'fields': ('plan_name', 'display_name', 'description', 'role')
        }),
        ('Pricing', {
            'fields': ('price_monthly', 'price_yearly')
        }),
        ('PayPal Integration', {
            'fields': ('paypal_plan_id_monthly', 'paypal_plan_id_annual', 'paypal_product_id'),
            'classes': ('collapse',)
        }),
        ('Stripe Integration', {
            'fields': ('stripe_plan_id_monthly', 'stripe_plan_id_annual'),
            'classes': ('collapse',)
        }),
        ('Coinbase Integration', {
            'fields': ('coinbase_plan_id_monthly', 'coinbase_plan_id_annual'),
            'classes': ('collapse',)
        }),
        ('Display Settings', {
            'fields': ('is_active', 'is_featured', 'display_order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(BillingAddress)
class BillingAddressAdmin(admin.ModelAdmin):
    list_display = ("user", "first_name", "last_name", "city", "country", "is_default", "payment_provider")
    list_filter = ("is_default", "is_active", "payment_provider")
    search_fields = ("user__username", "first_name", "last_name", "email", "city", "country")
    readonly_fields = ("created_at", "updated_at", "last_used_at")


@admin.register(CoinbaseCharge)
class CoinbaseChargeAdmin(admin.ModelAdmin):
    list_display = ("user", "charge_id", "name", "amount_usd", "currency", "status", "created_at")
    list_filter = ("status", "currency", "pricing_type")
    search_fields = ("user__username", "charge_id", "charge_code", "name")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ('Charge Information', {
            'fields': ('user', 'subscription', 'charge_id', 'charge_code', 'name', 'description')
        }),
        ('Pricing', {
            'fields': ('amount_usd', 'currency', 'pricing_type', 'status')
        }),
        ('URLs', {
            'fields': ('hosted_url', 'redirect_url', 'cancel_url')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'expires_at')
        }),
    )


@admin.register(CoinbaseTransaction)
class CoinbaseTransactionAdmin(admin.ModelAdmin):
    list_display = ("user", "transaction_id", "crypto_currency", "crypto_amount", "amount_usd", "status", "processed_at")
    list_filter = ("status", "crypto_currency", "network")
    search_fields = ("user__username", "transaction_id", "transaction_hash", "charge__charge_id")
    readonly_fields = ("created_at", "updated_at", "processed_at")
    fieldsets = (
        ('Transaction Information', {
            'fields': ('charge', 'user', 'subscription', 'transaction_id', 'status')
        }),
        ('Crypto Details', {
            'fields': ('crypto_currency', 'crypto_amount', 'amount_usd', 'exchange_rate')
        }),
        ('Blockchain Details', {
            'fields': ('network', 'transaction_hash', 'block_height', 'confirmations', 'payment_method')
        }),
        ('Timeline', {
            'fields': ('timeline',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('processed_at', 'created_at', 'updated_at')
        }),
    )
