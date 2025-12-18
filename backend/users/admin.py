from django.contrib import admin

from .models import (
    UserCorporateProfile,
    MonitoredSite,
)
from .permission_models import FeaturePermission


@admin.register(UserCorporateProfile)
class UserCorporateProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "company_name", "job_title", "updated_at")
    search_fields = ("user__username", "company_name", "job_title")




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




