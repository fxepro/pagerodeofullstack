from django.contrib import admin
from .models import DNSAnalysis


@admin.register(DNSAnalysis)
class DNSAnalysisAdmin(admin.ModelAdmin):
    list_display = ('url', 'dns_health_score', 'response_time_ms', 'dns_server', 'analyzed_at', 'user')
    list_filter = ('dns_health_score', 'analyzed_at')
    search_fields = ('url', 'dns_server', 'user__username', 'user__email')
    readonly_fields = ('analyzed_at',)
    date_hierarchy = 'analyzed_at'
    ordering = ('-analyzed_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('url', 'user', 'analyzed_at')
        }),
        ('DNS Server', {
            'fields': ('dns_server', 'dns_server_ip', 'response_time_ms')
        }),
        ('DNS Records', {
            'fields': ('a_records', 'aaaa_records', 'mx_records', 'txt_records', 
                      'cname_records', 'ns_records', 'soa_record', 'ptr_records', 'srv_records'),
            'classes': ('collapse',)
        }),
        ('Analysis Results', {
            'fields': ('dns_health_score', 'issues', 'recommendations')
        }),
        ('Additional Data', {
            'fields': ('full_results',),
            'classes': ('collapse',)
        }),
    )

