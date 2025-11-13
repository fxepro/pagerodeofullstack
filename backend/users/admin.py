from django.contrib import admin

from .models import (
    UserCorporateProfile,
    PaymentMethod,
    UserSubscription,
    BillingTransaction,
    MonitoredSite,
)


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
    list_display = ("user", "amount", "currency", "status", "created_at")
    list_filter = ("status", "currency")
    search_fields = ("user__username", "invoice_id", "description")


@admin.register(MonitoredSite)
class MonitoredSiteAdmin(admin.ModelAdmin):
    list_display = ("user", "url", "status", "last_check", "response_time", "uptime")
    list_filter = ("status",)
    search_fields = ("user__username", "url")
