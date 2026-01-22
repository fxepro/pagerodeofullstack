"""
Django admin configuration for db_management
"""
from django.contrib import admin
from .models import DatabaseConnection, DatabaseActivityLog, DatabasePerformanceMetrics


@admin.register(DatabaseConnection)
class DatabaseConnectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'engine', 'host', 'port', 'database', 'is_active', 'created_at']
    list_filter = ['engine', 'is_active', 'created_at']
    search_fields = ['name', 'host', 'database']
    readonly_fields = ['created_at', 'updated_at', 'created_by']


@admin.register(DatabaseActivityLog)
class DatabaseActivityLogAdmin(admin.ModelAdmin):
    list_display = ['connection', 'user', 'action', 'success', 'execution_time', 'created_at']
    list_filter = ['action', 'success', 'created_at', 'connection']
    search_fields = ['connection__name', 'user__username', 'query']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(DatabasePerformanceMetrics)
class DatabasePerformanceMetricsAdmin(admin.ModelAdmin):
    list_display = ['connection', 'total_connections', 'active_connections', 'table_count', 'collected_at']
    list_filter = ['connection', 'collected_at']
    search_fields = ['connection__name']
    readonly_fields = ['collected_at']
    date_hierarchy = 'collected_at'
