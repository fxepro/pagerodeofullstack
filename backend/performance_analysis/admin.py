from django.contrib import admin
from .models import PerformanceAnalysis, PerformanceHistory, NetworkRequest, ResourceBreakdown, PerformanceTimelineEvent


@admin.register(PerformanceAnalysis)
class PerformanceAnalysisAdmin(admin.ModelAdmin):
    list_display = ('url', 'device', 'performance_score', 'lcp', 'fid', 'cls', 'analyzed_at', 'user')
    list_filter = ('device', 'performance_score', 'analyzed_at', 'is_baseline')
    search_fields = ('url', 'user__username', 'user__email')
    readonly_fields = ('analyzed_at', 'score_change', 'lcp_change')
    date_hierarchy = 'analyzed_at'
    ordering = ('-analyzed_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('url', 'user', 'device', 'analyzed_at')
        }),
        ('Performance Scores', {
            'fields': ('performance_score', 'accessibility_score', 'best_practices_score', 'seo_score')
        }),
        ('Core Web Vitals', {
            'fields': ('lcp', 'fid', 'cls')
        }),
        ('Additional Metrics', {
            'fields': ('tti', 'tbt', 'fcp', 'speed_index', 'dom_content_loaded', 'first_paint')
        }),
        ('Resource Metrics', {
            'fields': ('page_size_mb', 'request_count', 'load_time')
        }),
        ('Historical Tracking', {
            'fields': ('is_baseline', 'baseline_id', 'score_change', 'lcp_change')
        }),
        ('Additional Data', {
            'fields': ('resources', 'recommendations', 'full_results'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PerformanceHistory)
class PerformanceHistoryAdmin(admin.ModelAdmin):
    list_display = ('url', 'device', 'date', 'hour', 'avg_score', 'analysis_count')
    list_filter = ('device', 'date')
    search_fields = ('url',)
    date_hierarchy = 'date'
    ordering = ('-date', '-hour')


@admin.register(NetworkRequest)
class NetworkRequestAdmin(admin.ModelAdmin):
    list_display = ('url', 'resource_type', 'duration', 'transfer_size', 'status_code', 'sequence')
    list_filter = ('resource_type', 'status_code', 'render_blocking_status', 'from_cache')
    search_fields = ('url',)
    readonly_fields = ('performance_analysis',)
    ordering = ('performance_analysis', 'sequence', 'start_time')
    raw_id_fields = ('performance_analysis',)


@admin.register(ResourceBreakdown)
class ResourceBreakdownAdmin(admin.ModelAdmin):
    list_display = ('url', 'category', 'transfer_size', 'resource_size', 'render_blocking')
    list_filter = ('category', 'render_blocking', 'unused_css', 'unused_javascript')
    search_fields = ('url',)
    readonly_fields = ('performance_analysis',)
    ordering = ('performance_analysis', '-transfer_size')
    raw_id_fields = ('performance_analysis',)


@admin.register(PerformanceTimelineEvent)
class PerformanceTimelineEventAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'timestamp', 'duration', 'phase', 'sequence')
    list_filter = ('category', 'phase')
    search_fields = ('name',)
    readonly_fields = ('performance_analysis',)
    ordering = ('performance_analysis', 'timestamp', 'sequence')
    raw_id_fields = ('performance_analysis',)

