from django.contrib import admin
from .models import LinksAnalysis


@admin.register(LinksAnalysis)
class LinksAnalysisAdmin(admin.ModelAdmin):
    list_display = ('url', 'total_links', 'broken_links', 'links_health_score', 'analyzed_at', 'user', 'audit_report')
    list_filter = ('links_health_score', 'analyzed_at', 'broken_links')
    search_fields = ('url', 'user__username', 'user__email')
    readonly_fields = ('analyzed_at',)
    date_hierarchy = 'analyzed_at'
    ordering = ('-analyzed_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('url', 'user', 'audit_report', 'analyzed_at')
        }),
        ('Links Summary', {
            'fields': ('total_links', 'internal_links', 'external_links', 'broken_links', 'redirect_links')
        }),
        ('Links Statistics', {
            'fields': ('links_by_status', 'avg_response_time', 'min_response_time', 'max_response_time')
        }),
        ('Analysis Results', {
            'fields': ('links_health_score', 'issues', 'recommendations', 'broken_links_list')
        }),
        ('Additional Data', {
            'fields': ('links', 'full_results'),
            'classes': ('collapse',)
        }),
    )

