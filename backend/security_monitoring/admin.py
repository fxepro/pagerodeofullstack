"""
Django Admin for Security Monitoring
"""

from django.contrib import admin
from .models import SecurityScan, SecurityFinding, SecurityScanSchedule, SecurityTool


@admin.register(SecurityScan)
class SecurityScanAdmin(admin.ModelAdmin):
    list_display = ['scan_type', 'target_url', 'tool_used', 'status', 'created_by', 'created_at']
    list_filter = ['scan_type', 'status', 'created_at']
    search_fields = ['target_url', 'tool_used']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SecurityFinding)
class SecurityFindingAdmin(admin.ModelAdmin):
    list_display = ['title', 'severity', 'status', 'scan', 'created_at']
    list_filter = ['severity', 'status', 'created_at']
    search_fields = ['title', 'description', 'cve_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SecurityScanSchedule)
class SecurityScanScheduleAdmin(admin.ModelAdmin):
    list_display = ['scan_type', 'target_url', 'frequency', 'enabled', 'next_run', 'created_at']
    list_filter = ['scan_type', 'frequency', 'enabled']
    search_fields = ['target_url']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SecurityTool)
class SecurityToolAdmin(admin.ModelAdmin):
    list_display = ['name', 'tool_type', 'status', 'is_active', 'last_tested', 'created_at']
    list_filter = ['tool_type', 'status', 'is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
