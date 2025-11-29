"""
Monitor Analysis Database Models

This module contains models for storing standalone monitor analysis results.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class MonitorAnalysis(models.Model):
    """
    Standalone monitor analysis results for audits or one-time analysis.
    Stores page status, response time, and uptime data for historical tracking.
    """
    # URL and user association
    url = models.URLField(max_length=2048, db_index=True, help_text='URL that was analyzed')
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='monitor_analyses',
        help_text='User who ran this analysis (null for anonymous)'
    )
    # Link to audit report (if part of a full audit)
    audit_report = models.ForeignKey(
        'audit_reports.AuditReport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='monitor_analyses',
        help_text='Audit report this analysis belongs to (if part of full audit)',
        db_index=True
    )
    
    # Status information
    status = models.CharField(
        max_length=16,
        choices=[
            ('up', 'Up'),
            ('down', 'Down'),
            ('checking', 'Checking'),
        ],
        help_text='Current status of the page'
    )
    status_code = models.IntegerField(
        null=True,
        blank=True,
        help_text='HTTP status code'
    )
    
    # Response time
    response_time = models.IntegerField(
        help_text='Response time in milliseconds',
        db_index=True
    )
    
    # SSL information (if HTTPS)
    ssl_valid = models.BooleanField(
        null=True,
        blank=True,
        help_text='Whether SSL certificate is valid (for HTTPS URLs)'
    )
    ssl_expires_in = models.IntegerField(
        null=True,
        blank=True,
        help_text='Days until SSL certificate expires'
    )
    ssl_issuer = models.CharField(
        max_length=255,
        blank=True,
        help_text='SSL certificate issuer'
    )
    
    # Server information
    server = models.CharField(
        max_length=255,
        blank=True,
        help_text='Server header value'
    )
    content_type = models.CharField(
        max_length=255,
        blank=True,
        help_text='Content-Type header value'
    )
    
    # Error information (if down)
    error_message = models.TextField(
        blank=True,
        help_text='Error message if check failed'
    )
    
    # Uptime tracking (for historical analysis)
    uptime_percentage = models.FloatField(
        null=True,
        blank=True,
        help_text='Uptime percentage over the tracking period'
    )
    total_checks = models.IntegerField(
        null=True,
        blank=True,
        help_text='Total number of checks performed'
    )
    successful_checks = models.IntegerField(
        null=True,
        blank=True,
        help_text='Number of successful checks'
    )
    failed_checks = models.IntegerField(
        null=True,
        blank=True,
        help_text='Number of failed checks'
    )
    
    # Response time statistics (for historical tracking)
    avg_response_time = models.FloatField(
        null=True,
        blank=True,
        help_text='Average response time over tracking period (ms)'
    )
    min_response_time = models.IntegerField(
        null=True,
        blank=True,
        help_text='Minimum response time (ms)'
    )
    max_response_time = models.IntegerField(
        null=True,
        blank=True,
        help_text='Maximum response time (ms)'
    )
    
    # Health score
    health_score = models.IntegerField(
        null=True,
        blank=True,
        help_text='Overall health score (0-100)'
    )
    issues = models.JSONField(
        default=list,
        blank=True,
        help_text='List of issues found'
    )
    recommendations = models.JSONField(
        default=list,
        blank=True,
        help_text='List of recommendations'
    )
    
    # Full results
    full_results = models.JSONField(
        default=dict,
        blank=True,
        help_text='Complete monitor analysis results'
    )
    
    # Timestamps
    analyzed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='When this analysis was performed'
    )
    
    class Meta:
        db_table = 'monitor_analysis'
        ordering = ['-analyzed_at']
        indexes = [
            models.Index(fields=['url', '-analyzed_at']),
            models.Index(fields=['user', '-analyzed_at']),
            models.Index(fields=['audit_report', '-analyzed_at']),
            models.Index(fields=['status', '-analyzed_at']),
            models.Index(fields=['response_time']),
        ]
        verbose_name = 'Monitor Analysis'
        verbose_name_plural = 'Monitor Analyses'
    
    def __str__(self):
        return f"{self.url} - {self.status} - {self.response_time}ms at {self.analyzed_at}"
