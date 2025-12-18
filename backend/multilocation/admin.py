from django.contrib import admin
from .models import Location, RunnerHealth


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'region_code', 'country', 'continent', 'status', 'created_at')
    list_filter = ('status', 'continent', 'country', 'created_at')
    search_fields = ('name', 'region_code', 'country', 'continent')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'


@admin.register(RunnerHealth)
class RunnerHealthAdmin(admin.ModelAdmin):
    list_display = ('runner_id', 'location', 'region', 'status', 'can_accept_jobs', 'cpu_load', 'latency_ms', 'current_jobs_running', 'updated_at')
    list_filter = ('status', 'can_accept_jobs', 'region', 'updated_at')
    search_fields = ('runner_id', 'location__name', 'location__region_code', 'region')
    readonly_fields = ('updated_at',)
    date_hierarchy = 'updated_at'
    fieldsets = (
        ('Basic Information', {
            'fields': ('location', 'runner_id', 'region', 'status', 'can_accept_jobs')
        }),
        ('System Metrics', {
            'fields': ('cpu_load', 'memory_used_mb', 'memory_total_mb', 'disk_free_mb')
        }),
        ('Performance', {
            'fields': ('latency_ms', 'current_jobs_running', 'last_lighthouse_run_sec')
        }),
        ('Timestamps', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        }),
    )
