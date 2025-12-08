from django.contrib import admin

from .models import (
    UserCorporateProfile,
    PaymentMethod,
    UserSubscription,
    BillingTransaction,
    MonitoredSite,
    PaymentProviderConfig,
    SubscriptionPlan,
    BillingAddress,
    PromotionalDeal,
)
from .permission_models import FeaturePermission


@admin.register(UserCorporateProfile)
class UserCorporateProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "company_name", "job_title", "updated_at")
    search_fields = ("user__username", "company_name", "job_title")


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ("user", "method_type", "nickname", "is_default", "created_at")
    list_filter = ("method_type", "is_default")
    search_fields = ("user__username", "nickname", "brand", "bank_name")


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan_name", "status", "start_date", "end_date", "is_recurring")
    list_filter = ("status", "is_recurring", "plan_name")
    search_fields = ("user__username", "plan_name", "role")


@admin.register(BillingTransaction)
class BillingTransactionAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "currency", "status", "payment_provider", "transaction_type", "created_at")
    list_filter = ("status", "payment_provider", "transaction_type", "currency")
    search_fields = ("user__username", "paypal_transaction_id", "invoice_id", "description")


@admin.register(PaymentProviderConfig)
class PaymentProviderConfigAdmin(admin.ModelAdmin):
    list_display = ("provider", "is_active", "is_live", "created_at", "updated_at")
    list_filter = ("provider", "is_active", "is_live")
    readonly_fields = ("created_at", "updated_at", "last_sync_at")


@admin.register(PromotionalDeal)
class PromotionalDealAdmin(admin.ModelAdmin):
    list_display = ("name", "base_plan", "deal_price", "billing_period", "discount_percentage", "featured", "is_active", "start_date", "end_date", "current_redemptions")
    list_filter = ("is_active", "featured", "billing_period", "start_date", "end_date")
    search_fields = ("name", "slug", "base_plan__plan_name", "description")
    readonly_fields = ("created_at", "updated_at", "current_redemptions")
    fieldsets = (
        ("Basic Information", {
            "fields": ("name", "slug", "description", "base_plan")
        }),
        ("Deal Configuration", {
            "fields": ("discount_percentage", "original_price", "deal_price", "billing_period")
        }),
        ("Payment Provider Integration", {
            "fields": (
                ("paypal_plan_id", "paypal_product_id"),
                ("stripe_plan_id", "stripe_product_id"),
                "coinbase_plan_id"
            )
        }),
        ("Timing", {
            "fields": ("start_date", "end_date", "is_active")
        }),
        ("Tracking", {
            "fields": ("max_redemptions", "current_redemptions")
        }),
        ("Display", {
            "fields": ("badge_text", "featured", "display_priority")
        }),
        ("Metadata", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ("plan_name", "display_name", "price_monthly", "price_yearly", "is_active", "is_featured", "display_order")
    list_filter = ("is_active", "is_featured", "role")
    search_fields = ("plan_name", "display_name")
    ordering = ("display_order", "price_monthly")


@admin.register(BillingAddress)
class BillingAddressAdmin(admin.ModelAdmin):
    list_display = ("user", "get_full_name", "city", "country", "is_default", "is_active", "payment_provider", "created_at")
    list_filter = ("is_default", "is_active", "payment_provider", "country")
    search_fields = ("user__username", "first_name", "last_name", "email", "city", "country")
    readonly_fields = ("created_at", "updated_at", "last_used_at")


@admin.register(MonitoredSite)
class MonitoredSiteAdmin(admin.ModelAdmin):
    list_display = ("user", "url", "status", "last_check", "response_time", "uptime")
    list_filter = ("status",)
    search_fields = ("user__username", "url")


@admin.register(FeaturePermission)
class FeaturePermissionAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category", "created_at")
    list_filter = ("category",)
    search_fields = ("code", "name", "description")
    ordering = ("category", "code")
