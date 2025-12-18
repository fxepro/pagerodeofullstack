from django.contrib import admin
from .models import PageTranslationStatus


@admin.register(PageTranslationStatus)
class PageTranslationStatusAdmin(admin.ModelAdmin):
    list_display = ['page_route', 'page_type', 'status', 'auto_discovered', 'last_checked', 'updated_by']
    list_filter = ['status', 'page_type', 'auto_discovered', 'last_checked']
    search_fields = ['page_route', 'component_path', 'notes']
    readonly_fields = ['created_at', 'last_checked', 'last_updated']
    date_hierarchy = 'last_checked'
    
    fieldsets = (
        ('Page Information', {
            'fields': ('page_route', 'component_path', 'page_type')
        }),
        ('Status', {
            'fields': ('status', 'auto_discovered', 'updated_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'last_checked', 'last_updated'),
            'classes': ('collapse',)
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
