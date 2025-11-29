from django.contrib import admin
from .models import SitemapAnalysis


@admin.register(SitemapAnalysis)
class SitemapAnalysisAdmin(admin.ModelAdmin):
    list_display = ('url', 'sitemap_found', 'total_urls', 'health_score', 'analyzed_at', 'user')
    list_filter = ('sitemap_found', 'is_sitemap_index', 'health_score', 'analyzed_at')
    search_fields = ('url', 'sitemap_url', 'user__username', 'user__email')
    readonly_fields = ('analyzed_at',)
    date_hierarchy = 'analyzed_at'
    ordering = ('-analyzed_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('url', 'user', 'analyzed_at')
        }),
        ('Sitemap Status', {
            'fields': ('sitemap_found', 'sitemap_url', 'sitemap_type', 'is_sitemap_index')
        }),
        ('Sitemap Content', {
            'fields': ('total_urls', 'last_modified', 'change_frequency', 'priority')
        }),
        ('Sitemap Index', {
            'fields': ('sitemap_index_urls',),
            'classes': ('collapse',)
        }),
        ('Analysis Results', {
            'fields': ('health_score', 'issues', 'recommendations')
        }),
        ('Additional Data', {
            'fields': ('urls', 'full_results'),
            'classes': ('collapse',)
        }),
    )

