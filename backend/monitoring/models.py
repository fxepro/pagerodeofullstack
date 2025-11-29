"""
Monitoring Database Models

This module contains all models for storing monitoring data including:
- Status checks and history
- Response time tracking
- Incidents
- SSL certificates
- Link discovery
- PageSpeed results (cached)
- SEO checks
- API endpoints
- Screenshots
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json


class StatusCheck(models.Model):
    """
    Historical record of each status check performed on a monitored site.
    Stores every check to enable historical analysis and charts.
    """
    site = models.ForeignKey('users.MonitoredSite', on_delete=models.CASCADE, related_name='status_checks')
    status = models.CharField(max_length=16, choices=[
        ('up', 'Up'),
        ('down', 'Down'),
        ('checking', 'Checking'),
    ])
    response_time = models.IntegerField(help_text='Response time in milliseconds')
    status_code = models.IntegerField(null=True, blank=True, help_text='HTTP status code')
    error_message = models.TextField(blank=True, help_text='Error message if check failed')
    checked_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True, help_text='Additional check metadata')
    
    class Meta:
        ordering = ['-checked_at']
        indexes = [
            models.Index(fields=['site', '-checked_at']),
            models.Index(fields=['-checked_at']),
        ]
    
    def __str__(self):
        return f"{self.site.url} - {self.status} at {self.checked_at}"


class ResponseTimeHistory(models.Model):
    """
    Aggregated response time data for charts and analytics.
    Stores daily/hourly aggregates to reduce data volume while maintaining chart accuracy.
    """
    site = models.ForeignKey('users.MonitoredSite', on_delete=models.CASCADE, related_name='response_time_history')
    date = models.DateField(db_index=True)
    hour = models.IntegerField(null=True, blank=True, help_text='Hour of day (0-23) for hourly aggregates')
    
    # Aggregated metrics
    p50 = models.FloatField(help_text='50th percentile (median) response time')
    p95 = models.FloatField(help_text='95th percentile response time')
    p99 = models.FloatField(null=True, blank=True, help_text='99th percentile response time')
    avg = models.FloatField(help_text='Average response time')
    min_response_time = models.IntegerField(help_text='Minimum response time')
    max_response_time = models.IntegerField(help_text='Maximum response time')
    check_count = models.IntegerField(help_text='Number of checks in this period')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date', '-hour']
        unique_together = [('site', 'date', 'hour')]
        indexes = [
            models.Index(fields=['site', '-date']),
        ]
    
    def __str__(self):
        period = f"{self.date} {self.hour:02d}:00" if self.hour is not None else str(self.date)
        return f"{self.site.url} - {period} - P95: {self.p95}ms"


class Incident(models.Model):
    """
    Detailed incident records for downtime and issues.
    Tracks start, end, duration, root cause, and impact.
    """
    STATUS_CHOICES = [
        ('resolved', 'Resolved'),
        ('ongoing', 'Ongoing'),
        ('investigating', 'Investigating'),
    ]
    
    IMPACT_CHOICES = [
        ('full_outage', 'Full Outage'),
        ('partial_outage', 'Partial Outage'),
        ('degraded', 'Degraded Performance'),
    ]
    
    site = models.ForeignKey('users.MonitoredSite', on_delete=models.CASCADE, related_name='incidents')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='investigating')
    impact = models.CharField(max_length=20, choices=IMPACT_CHOICES, default='degraded')
    
    # Timing
    started_at = models.DateTimeField(db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True, help_text='Duration in minutes')
    
    # Details
    root_cause = models.TextField(blank=True, help_text='Root cause description')
    affected_services = models.JSONField(default=list, blank=True, help_text='List of affected services')
    resolution_steps = models.TextField(blank=True, help_text='Steps taken to resolve')
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['site', '-started_at']),
            models.Index(fields=['status', '-started_at']),
        ]
    
    def __str__(self):
        return f"{self.site.url} - {self.status} - {self.started_at}"


class SSLCertificate(models.Model):
    """
    SSL certificate information and tracking.
    Stores certificate details, expiration, and chain validity.
    """
    site = models.ForeignKey('users.MonitoredSite', on_delete=models.CASCADE, related_name='ssl_certificates')
    
    # Certificate status
    is_valid = models.BooleanField()
    expires_at = models.DateTimeField()
    days_until_expiry = models.IntegerField(help_text='Days until certificate expires')
    
    # Certificate details
    issuer = models.CharField(max_length=255, blank=True, help_text='Certificate issuer (e.g., Let\'s Encrypt)')
    subject = models.CharField(max_length=255, blank=True)
    serial_number = models.CharField(max_length=255, blank=True)
    
    # Chain validity
    root_ca_valid = models.BooleanField(default=True)
    intermediate_valid = models.BooleanField(default=True)
    certificate_valid = models.BooleanField(default=True)
    
    # Protocol and cipher info
    protocol = models.CharField(max_length=20, blank=True, help_text='TLS version (e.g., TLS 1.3)')
    cipher_suite = models.CharField(max_length=255, blank=True)
    
    # Timestamps
    checked_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-checked_at']
        indexes = [
            models.Index(fields=['site', '-checked_at']),
        ]
    
    def __str__(self):
        return f"{self.site.url} - SSL - Valid: {self.is_valid} - Expires: {self.expires_at}"


class DiscoveredLink(models.Model):
    """
    Links discovered from crawling a monitored site.
    Stores all links found during crawl operations.
    """
    site = models.ForeignKey('users.MonitoredSite', on_delete=models.CASCADE, related_name='discovered_links')
    url = models.URLField(max_length=2048)
    path = models.CharField(max_length=2048, help_text='URL path for display')
    
    # Link properties
    is_internal = models.BooleanField(default=True, help_text='True if link is to same domain')
    is_external = models.BooleanField(default=False)
    is_redirect = models.BooleanField(default=False)
    
    # Discovery metadata
    discovered_at = models.DateTimeField(auto_now_add=True, db_index=True)
    crawl_session = models.CharField(max_length=255, blank=True, help_text='Crawl session identifier')
    
    # Current status (from latest check)
    current_status = models.IntegerField(null=True, blank=True, help_text='Latest HTTP status code')
    current_status_text = models.CharField(max_length=255, blank=True)
    last_checked = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-discovered_at']
        unique_together = [('site', 'url')]
        indexes = [
            models.Index(fields=['site', '-discovered_at']),
            models.Index(fields=['is_internal', 'current_status']),
        ]
    
    def __str__(self):
        return f"{self.site.url} - {self.path}"


class LinkCheck(models.Model):
    """
    Individual status checks for discovered links.
    Stores check history to enable the 12-bar status indicators.
    """
    link = models.ForeignKey(DiscoveredLink, on_delete=models.CASCADE, related_name='checks')
    status = models.IntegerField(help_text='HTTP status code')
    status_text = models.CharField(max_length=255, blank=True)
    response_time = models.IntegerField(help_text='Response time in milliseconds')
    checked_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Additional metadata
    redirect_url = models.URLField(max_length=2048, blank=True, help_text='Redirect target if status is 3xx')
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-checked_at']
        indexes = [
            models.Index(fields=['link', '-checked_at']),
            models.Index(fields=['-checked_at']),
        ]
    
    def __str__(self):
        return f"{self.link.path} - {self.status} at {self.checked_at}"


class PageSpeedResult(models.Model):
    """
    Cached PageSpeed Insights results to avoid repeated API calls.
    Stores results for desktop, mobile, and tablet devices.
    """
    DEVICE_CHOICES = [
        ('desktop', 'Desktop'),
        ('mobile', 'Mobile'),
        ('tablet', 'Tablet'),
    ]
    
    site = models.ForeignKey('users.MonitoredSite', on_delete=models.CASCADE, related_name='pagespeed_results')
    page_url = models.URLField(max_length=2048, help_text='Specific page URL tested')
    device = models.CharField(max_length=10, choices=DEVICE_CHOICES)
    
    # Performance score
    performance_score = models.IntegerField(help_text='Lighthouse performance score (0-100)')
    
    # Core Web Vitals
    lcp = models.FloatField(help_text='Largest Contentful Paint (seconds)')
    fid = models.FloatField(help_text='First Input Delay (milliseconds)')
    cls = models.FloatField(help_text='Cumulative Layout Shift')
    
    # Additional metrics
    tti = models.FloatField(null=True, blank=True, help_text='Time to Interactive (seconds)')
    tbt = models.FloatField(null=True, blank=True, help_text='Total Blocking Time (milliseconds)')
    fcp = models.FloatField(null=True, blank=True, help_text='First Contentful Paint (seconds)')
    
    # Resource metrics
    page_size_mb = models.FloatField(null=True, blank=True, help_text='Total page size in MB')
    request_count = models.IntegerField(null=True, blank=True, help_text='Number of HTTP requests')
    load_time = models.FloatField(null=True, blank=True, help_text='Total load time in seconds')
    
    # Full results (stored as JSON for flexibility)
    full_results = models.JSONField(default=dict, blank=True, help_text='Complete Lighthouse results')
    
    # Timestamps
    tested_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-tested_at']
        unique_together = [('site', 'page_url', 'device', 'tested_at')]
        indexes = [
            models.Index(fields=['site', '-tested_at']),
            models.Index(fields=['page_url', 'device', '-tested_at']),
        ]
    
    def __str__(self):
        return f"{self.site.url} - {self.device} - Score: {self.performance_score} at {self.tested_at}"


class SEOCheck(models.Model):
    """
    SEO health check results for monitored sites.
    Stores title, meta, canonical, robots.txt, and structured data info.
    """
    site = models.ForeignKey('users.MonitoredSite', on_delete=models.CASCADE, related_name='seo_checks')
    page_url = models.URLField(max_length=2048, help_text='Page URL checked')
    
    # Title tag
    title_present = models.BooleanField(default=False)
    title_value = models.CharField(max_length=255, blank=True)
    title_length = models.IntegerField(null=True, blank=True)
    
    # Meta description
    meta_description_present = models.BooleanField(default=False)
    meta_description_value = models.TextField(blank=True)
    meta_description_length = models.IntegerField(null=True, blank=True)
    
    # Canonical URL
    canonical_present = models.BooleanField(default=False)
    canonical_url = models.URLField(max_length=2048, blank=True)
    
    # Robots.txt
    robots_txt_found = models.BooleanField(default=False)
    robots_txt_content = models.TextField(blank=True)
    
    # Open Graph tags
    og_tags_present = models.BooleanField(default=False)
    og_tags_count = models.IntegerField(default=0)
    og_tags = models.JSONField(default=dict, blank=True, help_text='Open Graph tags as key-value pairs')
    
    # Structured data
    structured_data_present = models.BooleanField(default=False)
    structured_data_type = models.CharField(max_length=50, blank=True, help_text='JSON-LD, Microdata, etc.')
    structured_data_schemas = models.JSONField(default=list, blank=True, help_text='List of schema types found')
    
    # Overall score
    overall_score = models.IntegerField(null=True, blank=True, help_text='Overall SEO score (0-100)')
    
    # Timestamps
    checked_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-checked_at']
        indexes = [
            models.Index(fields=['site', '-checked_at']),
            models.Index(fields=['page_url', '-checked_at']),
        ]
    
    def __str__(self):
        return f"{self.site.url} - SEO Check at {self.checked_at}"


class APIEndpoint(models.Model):
    """
    API endpoints discovered from homepage crawling.
    Stores JSON endpoints found during link discovery.
    """
    METHOD_CHOICES = [
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('DELETE', 'DELETE'),
        ('PATCH', 'PATCH'),
    ]
    
    site = models.ForeignKey('users.MonitoredSite', on_delete=models.CASCADE, related_name='api_endpoints')
    endpoint_url = models.URLField(max_length=2048)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES, default='GET')
    
    # Status
    status_code = models.IntegerField(null=True, blank=True)
    response_type = models.CharField(max_length=50, blank=True, help_text='JSON, XML, HTML, etc.')
    
    # Discovery metadata
    discovered_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_checked = models.DateTimeField(null=True, blank=True)
    
    # Additional info
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-discovered_at']
        unique_together = [('site', 'endpoint_url', 'method')]
        indexes = [
            models.Index(fields=['site', '-discovered_at']),
        ]
    
    def __str__(self):
        return f"{self.site.url} - {self.method} {self.endpoint_url}"


class Screenshot(models.Model):
    """
    Screenshots captured for monitored pages.
    Stores current screenshots and baselines for visual comparison.
    """
    site = models.ForeignKey('users.MonitoredSite', on_delete=models.CASCADE, related_name='screenshots')
    page_url = models.URLField(max_length=2048, help_text='Page URL screenshot was taken of')
    
    # Image storage
    image_url = models.URLField(max_length=2048, help_text='URL to stored screenshot image')
    image_path = models.CharField(max_length=512, blank=True, help_text='File system path if stored locally')
    
    # Screenshot metadata
    width = models.IntegerField(help_text='Screenshot width in pixels')
    height = models.IntegerField(help_text='Screenshot height in pixels')
    device_type = models.CharField(max_length=20, blank=True, help_text='Desktop, Mobile, Tablet')
    
    # Baseline comparison
    is_baseline = models.BooleanField(default=False, help_text='True if this is the baseline screenshot')
    baseline_id = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, 
                                    related_name='comparisons', help_text='Reference to baseline screenshot')
    diff_percentage = models.FloatField(null=True, blank=True, help_text='Percentage difference from baseline')
    
    # Timestamps
    captured_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-captured_at']
        indexes = [
            models.Index(fields=['site', '-captured_at']),
            models.Index(fields=['page_url', '-captured_at']),
            models.Index(fields=['is_baseline']),
        ]
    
    def __str__(self):
        return f"{self.site.url} - Screenshot at {self.captured_at}"

