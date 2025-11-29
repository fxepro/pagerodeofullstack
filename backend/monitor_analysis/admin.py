"""
Admin configuration for Monitor Analysis
"""

from django.contrib import admin
from .models import MonitorAnalysis


@admin.register(MonitorAnalysis)
class MonitorAnalysisAdmin(admin.ModelAdmin):
    list_display = ['url', 'status', 'response_time', 'status_code', 'analyzed_at', 'user', 'audit_report']
    list_filter = ['status', 'analyzed_at', 'ssl_valid']
    search_fields = ['url', 'error_message']
    readonly_fields = ['analyzed_at']
    date_hierarchy = 'analyzed_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('url', 'user', 'audit_report', 'analyzed_at')
        }),
        ('Status', {
            'fields': ('status', 'status_code', 'response_time', 'error_message')
        }),
        ('SSL Information', {
            'fields': ('ssl_valid', 'ssl_expires_in', 'ssl_issuer'),
            'classes': ('collapse',)
        }),
        ('Server Information', {
            'fields': ('server', 'content_type'),
            'classes': ('collapse',)
        }),
        ('Uptime Tracking', {
            'fields': ('uptime_percentage', 'total_checks', 'successful_checks', 'failed_checks'),
            'classes': ('collapse',)
        }),
        ('Response Time Statistics', {
            'fields': ('avg_response_time', 'min_response_time', 'max_response_time'),
            'classes': ('collapse',)
        }),
        ('Health & Recommendations', {
            'fields': ('health_score', 'issues', 'recommendations'),
            'classes': ('collapse',)
        }),
        ('Full Results', {
            'fields': ('full_results',),
            'classes': ('collapse',)
        }),
    )
