"""
DNS Analysis Database Models

This module contains models for storing DNS analysis results.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class DNSAnalysis(models.Model):
    """
    DNS analysis results for a domain.
    """
    # URL and user association
    url = models.URLField(max_length=2048, db_index=True, help_text='Domain/URL that was analyzed')
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dns_analyses',
        help_text='User who ran this analysis (null for anonymous)'
    )
    # Link to audit report (if part of a full audit)
    audit_report = models.ForeignKey(
        'audit_reports.AuditReport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dns_analyses',
        help_text='Audit report this analysis belongs to (if part of full audit)',
        db_index=True
    )
    
    # DNS Records found
    a_records = models.JSONField(
        default=list,
        blank=True,
        help_text='List of A records (IPv4 addresses)'
    )
    aaaa_records = models.JSONField(
        default=list,
        blank=True,
        help_text='List of AAAA records (IPv6 addresses)'
    )
    mx_records = models.JSONField(
        default=list,
        blank=True,
        help_text='List of MX records (mail servers)'
    )
    txt_records = models.JSONField(
        default=list,
        blank=True,
        help_text='List of TXT records'
    )
    cname_records = models.JSONField(
        default=list,
        blank=True,
        help_text='List of CNAME records'
    )
    ns_records = models.JSONField(
        default=list,
        blank=True,
        help_text='List of NS records (name servers)'
    )
    soa_record = models.JSONField(
        default=dict,
        blank=True,
        help_text='SOA record information'
    )
    ptr_records = models.JSONField(
        default=list,
        blank=True,
        help_text='List of PTR records'
    )
    srv_records = models.JSONField(
        default=list,
        blank=True,
        help_text='List of SRV records'
    )
    
    # Response times
    response_time_ms = models.FloatField(
        null=True,
        blank=True,
        help_text='DNS query response time in milliseconds'
    )
    
    # DNS server used
    dns_server = models.CharField(
        max_length=255,
        blank=True,
        help_text='DNS server used for query'
    )
    dns_server_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address of DNS server used'
    )
    
    # DNS Health
    dns_health_score = models.IntegerField(
        null=True,
        blank=True,
        help_text='Overall DNS health score (0-100)'
    )
    issues = models.JSONField(
        default=list,
        blank=True,
        help_text='List of DNS issues found'
    )
    recommendations = models.JSONField(
        default=list,
        blank=True,
        help_text='List of DNS recommendations'
    )
    
    # Full results
    full_results = models.JSONField(
        default=dict,
        blank=True,
        help_text='Complete DNS analysis results'
    )
    
    # Timestamps
    analyzed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='When this analysis was performed'
    )
    
    class Meta:
        db_table = 'dns_analysis'
        ordering = ['-analyzed_at']
        indexes = [
            models.Index(fields=['url', '-analyzed_at']),
            models.Index(fields=['user', '-analyzed_at']),
            models.Index(fields=['audit_report', '-analyzed_at']),
        ]
        verbose_name = 'DNS Analysis'
        verbose_name_plural = 'DNS Analyses'
    
    def __str__(self):
        return f"{self.url} - DNS Analysis at {self.analyzed_at}"

