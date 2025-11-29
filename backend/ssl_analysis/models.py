"""
SSL Analysis Database Models

This module contains models for storing standalone SSL analysis results.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class SSLAnalysis(models.Model):
    """
    Standalone SSL analysis results for audits or one-time analysis.
    """
    # URL and user association
    url = models.URLField(max_length=2048, db_index=True, help_text='URL that was analyzed')
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ssl_analyses',
        help_text='User who ran this analysis (null for anonymous)'
    )
    # Link to audit report (if part of a full audit)
    audit_report = models.ForeignKey(
        'audit_reports.AuditReport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ssl_analyses',
        help_text='Audit report this analysis belongs to (if part of full audit)',
        db_index=True
    )
    
    # Certificate status
    is_valid = models.BooleanField(help_text='Whether SSL certificate is valid')
    expires_at = models.DateTimeField(null=True, blank=True, help_text='Certificate expiration date/time')
    days_until_expiry = models.IntegerField(
        null=True,
        blank=True,
        help_text='Days until certificate expires'
    )
    
    # Certificate details
    issuer = models.CharField(
        max_length=255,
        blank=True,
        help_text='Certificate issuer (e.g., Let\'s Encrypt)'
    )
    subject = models.CharField(
        max_length=255,
        blank=True,
        help_text='Certificate subject'
    )
    serial_number = models.CharField(
        max_length=255,
        blank=True,
        help_text='Certificate serial number'
    )
    
    # Chain validity
    root_ca_valid = models.BooleanField(
        default=True,
        help_text='Root CA certificate is valid'
    )
    intermediate_valid = models.BooleanField(
        default=True,
        help_text='Intermediate certificate is valid'
    )
    certificate_valid = models.BooleanField(
        default=True,
        help_text='Certificate itself is valid'
    )
    
    # Protocol and cipher info
    protocol = models.CharField(
        max_length=20,
        blank=True,
        help_text='TLS version (e.g., TLS 1.3)'
    )
    cipher_suite = models.CharField(
        max_length=255,
        blank=True,
        help_text='Cipher suite used'
    )
    
    # Additional SSL information
    certificate_chain = models.JSONField(
        default=list,
        blank=True,
        help_text='Full certificate chain information'
    )
    san_domains = models.JSONField(
        default=list,
        blank=True,
        help_text='Subject Alternative Names (SAN) domains'
    )
    
    # SSL Health
    ssl_health_score = models.IntegerField(
        null=True,
        blank=True,
        help_text='Overall SSL health score (0-100)'
    )
    issues = models.JSONField(
        default=list,
        blank=True,
        help_text='List of SSL issues found'
    )
    recommendations = models.JSONField(
        default=list,
        blank=True,
        help_text='List of SSL recommendations'
    )
    
    # Full results
    full_results = models.JSONField(
        default=dict,
        blank=True,
        help_text='Complete SSL analysis results'
    )
    
    # Timestamps
    analyzed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='When this analysis was performed'
    )
    
    class Meta:
        db_table = 'ssl_analysis'
        ordering = ['-analyzed_at']
        indexes = [
            models.Index(fields=['url', '-analyzed_at']),
            models.Index(fields=['user', '-analyzed_at']),
            models.Index(fields=['audit_report', '-analyzed_at']),
            models.Index(fields=['is_valid']),
        ]
        verbose_name = 'SSL Analysis'
        verbose_name_plural = 'SSL Analyses'
    
    def __str__(self):
        return f"{self.url} - SSL Analysis at {self.analyzed_at}"

