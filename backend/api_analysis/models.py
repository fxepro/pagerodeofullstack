"""
API Analysis Database Models

This module contains models for storing standalone API analysis results.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class APIAnalysis(models.Model):
    """
    Standalone API analysis results for audits or one-time analysis.
    """
    METHOD_CHOICES = [
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('DELETE', 'DELETE'),
        ('PATCH', 'PATCH'),
        ('HEAD', 'HEAD'),
        ('OPTIONS', 'OPTIONS'),
    ]
    
    # URL and user association
    url = models.URLField(max_length=2048, db_index=True, help_text='Base URL that was analyzed')
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='api_analyses',
        help_text='User who ran this analysis (null for anonymous)'
    )
    # Link to audit report (if part of a full audit)
    audit_report = models.ForeignKey(
        'audit_reports.AuditReport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='api_analyses',
        help_text='Audit report this analysis belongs to (if part of full audit)',
        db_index=True
    )
    
    # Discovered endpoints
    endpoints = models.JSONField(
        default=list,
        blank=True,
        help_text='List of discovered API endpoints with methods, status codes, etc.'
    )
    
    # Summary statistics
    total_endpoints = models.IntegerField(
        null=True,
        blank=True,
        help_text='Total number of endpoints discovered',
        db_index=True
    )
    endpoints_by_method = models.JSONField(
        default=dict,
        blank=True,
        help_text='Count of endpoints by HTTP method'
    )
    endpoints_by_status = models.JSONField(
        default=dict,
        blank=True,
        help_text='Count of endpoints by HTTP status code'
    )
    
    # API Health
    api_health_score = models.IntegerField(
        null=True,
        blank=True,
        help_text='Overall API health score (0-100)'
    )
    issues = models.JSONField(
        default=list,
        blank=True,
        help_text='List of API issues found'
    )
    recommendations = models.JSONField(
        default=list,
        blank=True,
        help_text='List of API recommendations'
    )
    
    # Response types discovered
    response_types = models.JSONField(
        default=list,
        blank=True,
        help_text='List of response types found (JSON, XML, HTML, etc.)'
    )
    
    # Authentication/Authorization info
    auth_methods = models.JSONField(
        default=list,
        blank=True,
        help_text='Authentication methods detected'
    )
    requires_auth = models.BooleanField(
        null=True,
        blank=True,
        help_text='Whether API requires authentication'
    )
    
    # Full results
    full_results = models.JSONField(
        default=dict,
        blank=True,
        help_text='Complete API analysis results'
    )
    
    # Timestamps
    analyzed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='When this analysis was performed'
    )
    
    class Meta:
        db_table = 'api_analysis'
        ordering = ['-analyzed_at']
        indexes = [
            models.Index(fields=['url', '-analyzed_at']),
            models.Index(fields=['user', '-analyzed_at']),
            models.Index(fields=['audit_report', '-analyzed_at']),
        ]
        verbose_name = 'API Analysis'
        verbose_name_plural = 'API Analyses'
    
    def __str__(self):
        return f"{self.url} - API Analysis at {self.analyzed_at}"

