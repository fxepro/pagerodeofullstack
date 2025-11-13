from django.contrib import admin
from .models import AuditReport


@admin.register(AuditReport)
class AuditReportAdmin(admin.ModelAdmin):
    list_display = [
        'url', 
        'user', 
        'status', 
        'tools_count', 
        'file_size_mb',
        'created_at',
        'completed_at'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['url', 'user__username', 'user__email']
    readonly_fields = [
        'id',
        'created_at',
        'completed_at',
        'file_size_mb',
        'duration_seconds'
    ]
    
    fieldsets = (
        ('Report Details', {
            'fields': ('id', 'user', 'url', 'tools_selected')
        }),
        ('Status', {
            'fields': ('status', 'error_message')
        }),
        ('File Information', {
            'fields': ('pdf_url', 'file_size_bytes', 'file_size_mb')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'completed_at', 'expires_at', 'duration_seconds')
        }),
        ('Audit Data', {
            'fields': ('audit_data',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Reports are created via API only
        return False

