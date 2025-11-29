from django.contrib import admin
from .models import APIAnalysis


@admin.register(APIAnalysis)
class APIAnalysisAdmin(admin.ModelAdmin):
    list_display = ('url', 'total_endpoints', 'api_health_score', 'analyzed_at', 'user', 'audit_report')
    list_filter = ('api_health_score', 'analyzed_at', 'requires_auth')
    search_fields = ('url', 'user__username', 'user__email')
    readonly_fields = ('analyzed_at',)
    date_hierarchy = 'analyzed_at'
    ordering = ('-analyzed_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('url', 'user', 'audit_report', 'analyzed_at')
        }),
        ('Endpoints Summary', {
            'fields': ('total_endpoints', 'endpoints_by_method', 'endpoints_by_status', 'response_types')
        }),
        ('Authentication', {
            'fields': ('requires_auth', 'auth_methods')
        }),
        ('Analysis Results', {
            'fields': ('api_health_score', 'issues', 'recommendations')
        }),
        ('Additional Data', {
            'fields': ('endpoints', 'full_results'),
            'classes': ('collapse',)
        }),
    )

