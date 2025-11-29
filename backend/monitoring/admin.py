from django.contrib import admin
from .models import (
    StatusCheck,
    ResponseTimeHistory,
    Incident,
    SSLCertificate,
    DiscoveredLink,
    LinkCheck,
    PageSpeedResult,
    SEOCheck,
    APIEndpoint,
    Screenshot,
)


@admin.register(StatusCheck)
class StatusCheckAdmin(admin.ModelAdmin):
    list_display = ['site', 'status', 'response_time', 'status_code', 'checked_at']
    list_filter = ['status', 'checked_at']
    search_fields = ['site__url', 'error_message']
    readonly_fields = ['checked_at']
    date_hierarchy = 'checked_at'


@admin.register(ResponseTimeHistory)
class ResponseTimeHistoryAdmin(admin.ModelAdmin):
    list_display = ['site', 'date', 'hour', 'p95', 'avg', 'check_count']
    list_filter = ['date']
    search_fields = ['site__url']
    readonly_fields = ['created_at']


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ['site', 'status', 'impact', 'started_at', 'resolved_at', 'duration_minutes']
    list_filter = ['status', 'impact', 'started_at']
    search_fields = ['site__url', 'root_cause']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'started_at'


@admin.register(SSLCertificate)
class SSLCertificateAdmin(admin.ModelAdmin):
    list_display = ['site', 'is_valid', 'expires_at', 'days_until_expiry', 'issuer', 'checked_at']
    list_filter = ['is_valid', 'checked_at']
    search_fields = ['site__url', 'issuer']
    readonly_fields = ['checked_at']
    date_hierarchy = 'checked_at'


@admin.register(DiscoveredLink)
class DiscoveredLinkAdmin(admin.ModelAdmin):
    list_display = ['site', 'path', 'is_internal', 'current_status', 'discovered_at']
    list_filter = ['is_internal', 'current_status', 'discovered_at']
    search_fields = ['site__url', 'url', 'path']
    readonly_fields = ['discovered_at']
    date_hierarchy = 'discovered_at'


@admin.register(LinkCheck)
class LinkCheckAdmin(admin.ModelAdmin):
    list_display = ['link', 'status', 'response_time', 'checked_at']
    list_filter = ['status', 'checked_at']
    search_fields = ['link__path', 'error_message']
    readonly_fields = ['checked_at']
    date_hierarchy = 'checked_at'


@admin.register(PageSpeedResult)
class PageSpeedResultAdmin(admin.ModelAdmin):
    list_display = ['site', 'page_url', 'device', 'performance_score', 'lcp', 'fid', 'cls', 'tested_at']
    list_filter = ['device', 'tested_at']
    search_fields = ['site__url', 'page_url']
    readonly_fields = ['tested_at']
    date_hierarchy = 'tested_at'


@admin.register(SEOCheck)
class SEOCheckAdmin(admin.ModelAdmin):
    list_display = ['site', 'page_url', 'overall_score', 'title_present', 'meta_description_present', 'checked_at']
    list_filter = ['title_present', 'meta_description_present', 'checked_at']
    search_fields = ['site__url', 'page_url']
    readonly_fields = ['checked_at']
    date_hierarchy = 'checked_at'


@admin.register(APIEndpoint)
class APIEndpointAdmin(admin.ModelAdmin):
    list_display = ['site', 'endpoint_url', 'method', 'status_code', 'response_type', 'discovered_at']
    list_filter = ['method', 'status_code', 'discovered_at']
    search_fields = ['site__url', 'endpoint_url']
    readonly_fields = ['discovered_at']
    date_hierarchy = 'discovered_at'


@admin.register(Screenshot)
class ScreenshotAdmin(admin.ModelAdmin):
    list_display = ['site', 'page_url', 'device_type', 'is_baseline', 'width', 'height', 'captured_at']
    list_filter = ['is_baseline', 'device_type', 'captured_at']
    search_fields = ['site__url', 'page_url']
    readonly_fields = ['captured_at']
    date_hierarchy = 'captured_at'

