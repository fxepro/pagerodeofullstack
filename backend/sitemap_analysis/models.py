"""
Sitemap Analysis Database Models

This module contains models for storing sitemap analysis results.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class SitemapAnalysis(models.Model):
    """
    Sitemap analysis results for a website.
    """
    # URL and user association
    url = models.URLField(max_length=2048, db_index=True, help_text='Website URL that was analyzed')
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sitemap_analyses',
        help_text='User who ran this analysis (null for anonymous)'
    )
    # Link to audit report (if part of a full audit)
    audit_report = models.ForeignKey(
        'audit_reports.AuditReport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sitemap_analyses',
        help_text='Audit report this analysis belongs to (if part of full audit)',
        db_index=True
    )
    
    # Sitemap status
    sitemap_found = models.BooleanField(
        default=False,
        help_text='Whether a sitemap was found'
    )
    sitemap_url = models.URLField(
        max_length=2048,
        blank=True,
        help_text='URL of the sitemap file'
    )
    sitemap_type = models.CharField(
        max_length=50,
        blank=True,
        help_text='Type of sitemap (XML, TXT, RSS, etc.)'
    )
    
    # Sitemap content
    total_urls = models.IntegerField(
        null=True,
        blank=True,
        help_text='Total number of URLs in sitemap',
        db_index=True
    )
    last_modified = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Last modified date of sitemap'
    )
    change_frequency = models.CharField(
        max_length=50,
        blank=True,
        help_text='Default change frequency'
    )
    priority = models.FloatField(
        null=True,
        blank=True,
        help_text='Default priority (0.0-1.0)'
    )
    
    # URLs in sitemap
    urls = models.JSONField(
        default=list,
        blank=True,
        help_text='List of URLs found in sitemap'
    )
    
    # Sitemap index (for sitemap indexes)
    is_sitemap_index = models.BooleanField(
        default=False,
        help_text='True if this is a sitemap index file'
    )
    sitemap_index_urls = models.JSONField(
        default=list,
        blank=True,
        help_text='List of sitemap URLs if this is a sitemap index'
    )
    
    # Analysis results
    issues = models.JSONField(
        default=list,
        blank=True,
        help_text='List of sitemap issues found'
    )
    recommendations = models.JSONField(
        default=list,
        blank=True,
        help_text='List of sitemap recommendations'
    )
    health_score = models.IntegerField(
        null=True,
        blank=True,
        help_text='Sitemap health score (0-100)'
    )
    
    # Full results
    full_results = models.JSONField(
        default=dict,
        blank=True,
        help_text='Complete sitemap analysis results'
    )
    
    # Timestamps
    analyzed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='When this analysis was performed'
    )
    
    class Meta:
        db_table = 'sitemap_analysis'
        ordering = ['-analyzed_at']
        indexes = [
            models.Index(fields=['url', '-analyzed_at']),
            models.Index(fields=['user', '-analyzed_at']),
            models.Index(fields=['audit_report', '-analyzed_at']),
            models.Index(fields=['sitemap_found']),
        ]
        verbose_name = 'Sitemap Analysis'
        verbose_name_plural = 'Sitemap Analyses'
    
    def __str__(self):
        return f"{self.url} - Sitemap Analysis at {self.analyzed_at}"

