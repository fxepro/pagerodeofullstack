from django.contrib import admin
from .models import SSLAnalysis


@admin.register(SSLAnalysis)
class SSLAnalysisAdmin(admin.ModelAdmin):
    list_display = ('url', 'is_valid', 'ssl_health_score', 'expires_at', 'analyzed_at', 'user', 'audit_report')
    list_filter = ('is_valid', 'ssl_health_score', 'analyzed_at', 'protocol')
    search_fields = ('url', 'issuer', 'subject', 'user__username', 'user__email')
    readonly_fields = ('analyzed_at',)
    date_hierarchy = 'analyzed_at'
    ordering = ('-analyzed_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('url', 'user', 'audit_report', 'analyzed_at')
        }),
        ('Certificate Status', {
            'fields': ('is_valid', 'expires_at', 'days_until_expiry')
        }),
        ('Certificate Details', {
            'fields': ('issuer', 'subject', 'serial_number', 'san_domains')
        }),
        ('Chain Validity', {
            'fields': ('root_ca_valid', 'intermediate_valid', 'certificate_valid', 'certificate_chain')
        }),
        ('Protocol & Cipher', {
            'fields': ('protocol', 'cipher_suite')
        }),
        ('Analysis Results', {
            'fields': ('ssl_health_score', 'issues', 'recommendations')
        }),
        ('Additional Data', {
            'fields': ('full_results',),
            'classes': ('collapse',)
        }),
    )

