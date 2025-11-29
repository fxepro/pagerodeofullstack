"""
Links Analysis Database Models

This module contains models for storing standalone links analysis results.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class LinksAnalysis(models.Model):
    """
    Standalone links analysis results for audits or one-time analysis.
    """
    # URL and user association
    url = models.URLField(max_length=2048, db_index=True, help_text='Base URL that was analyzed')
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='links_analyses',
        help_text='User who ran this analysis (null for anonymous)'
    )
    # Link to audit report (if part of a full audit)
    audit_report = models.ForeignKey(
        'audit_reports.AuditReport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='links_analyses',
        help_text='Audit report this analysis belongs to (if part of full audit)',
        db_index=True
    )
    
    # Discovered links
    links = models.JSONField(
        default=list,
        blank=True,
        help_text='List of discovered links with status codes, types, etc.'
    )
    
    # Summary statistics
    total_links = models.IntegerField(
        null=True,
        blank=True,
        help_text='Total number of links discovered',
        db_index=True
    )
    internal_links = models.IntegerField(
        null=True,
        blank=True,
        help_text='Number of internal links'
    )
    external_links = models.IntegerField(
        null=True,
        blank=True,
        help_text='Number of external links'
    )
    broken_links = models.IntegerField(
        null=True,
        blank=True,
        help_text='Number of broken links (4xx, 5xx, or 0 status)',
        db_index=True
    )
    redirect_links = models.IntegerField(
        null=True,
        blank=True,
        help_text='Number of redirect links (3xx status)'
    )
    
    # Links by status code
    links_by_status = models.JSONField(
        default=dict,
        blank=True,
        help_text='Count of links by HTTP status code'
    )
    
    # Links Health
    links_health_score = models.IntegerField(
        null=True,
        blank=True,
        help_text='Overall links health score (0-100)'
    )
    issues = models.JSONField(
        default=list,
        blank=True,
        help_text='List of links issues found (broken links, etc.)'
    )
    recommendations = models.JSONField(
        default=list,
        blank=True,
        help_text='List of links recommendations'
    )
    
    # Broken links details
    broken_links_list = models.JSONField(
        default=list,
        blank=True,
        help_text='List of broken links with details'
    )
    
    # Response time statistics
    avg_response_time = models.FloatField(
        null=True,
        blank=True,
        help_text='Average response time for all links (ms)'
    )
    min_response_time = models.FloatField(
        null=True,
        blank=True,
        help_text='Minimum response time (ms)'
    )
    max_response_time = models.FloatField(
        null=True,
        blank=True,
        help_text='Maximum response time (ms)'
    )
    
    # Full results
    full_results = models.JSONField(
        default=dict,
        blank=True,
        help_text='Complete links analysis results'
    )
    
    # Timestamps
    analyzed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='When this analysis was performed'
    )
    
    class Meta:
        db_table = 'links_analysis'
        ordering = ['-analyzed_at']
        indexes = [
            models.Index(fields=['url', '-analyzed_at']),
            models.Index(fields=['user', '-analyzed_at']),
            models.Index(fields=['audit_report', '-analyzed_at']),
            models.Index(fields=['broken_links']),
        ]
        verbose_name = 'Links Analysis'
        verbose_name_plural = 'Links Analyses'
    
    def __str__(self):
        return f"{self.url} - Links Analysis at {self.analyzed_at}"

