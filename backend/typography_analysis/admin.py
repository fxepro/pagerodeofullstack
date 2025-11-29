from django.contrib import admin
from .models import TypographyAnalysis


@admin.register(TypographyAnalysis)
class TypographyAnalysisAdmin(admin.ModelAdmin):
    list_display = ('url', 'total_fonts', 'health_score', 'analyzed_at', 'user')
    list_filter = ('health_score', 'analyzed_at')
    search_fields = ('url', 'user__username', 'user__email')
    readonly_fields = ('analyzed_at',)
    date_hierarchy = 'analyzed_at'
    ordering = ('-analyzed_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('url', 'user', 'analyzed_at')
        }),
        ('Font Analysis', {
            'fields': ('fonts_used', 'font_families', 'font_sizes', 'font_weights', 'line_heights')
        }),
        ('Typography Metrics', {
            'fields': ('total_fonts', 'total_font_sizes', 'min_font_size', 'max_font_size', 'avg_font_size')
        }),
        ('Analysis Results', {
            'fields': ('health_score', 'issues', 'recommendations', 'accessibility_issues')
        }),
        ('Additional Data', {
            'fields': ('full_results',),
            'classes': ('collapse',)
        }),
    )

