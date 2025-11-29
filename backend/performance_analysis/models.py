"""
Performance Analysis Database Models

This module contains models for storing standalone performance analysis results
with historical tracking - a unique feature that enables trend analysis over time.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json


class PerformanceAnalysis(models.Model):
    """
    Standalone performance analysis results with historical tracking.
    
    This model stores every performance analysis run, enabling:
    - Historical trend analysis (unique feature)
    - Performance comparison over time
    - Improvement/degradation tracking
    - Multi-device performance history
    """
    DEVICE_CHOICES = [
        ('desktop', 'Desktop'),
        ('mobile', 'Mobile'),
        ('tablet', 'Tablet'),
    ]
    
    # URL and user association
    url = models.URLField(max_length=2048, db_index=True, help_text='URL that was analyzed')
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='performance_analyses',
        help_text='User who ran this analysis (null for anonymous)'
    )
    # Link to audit report (if part of a full audit)
    audit_report = models.ForeignKey(
        'audit_reports.AuditReport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='performance_analyses',
        help_text='Audit report this analysis belongs to (if part of full audit)',
        db_index=True
    )
    device = models.CharField(
        max_length=10, 
        choices=DEVICE_CHOICES, 
        default='desktop',
        help_text='Device type used for analysis'
    )
    
    # Performance Score (Lighthouse)
    performance_score = models.IntegerField(
        help_text='Lighthouse performance score (0-100)',
        db_index=True
    )
    
    # Core Web Vitals (Critical metrics)
    lcp = models.FloatField(
        help_text='Largest Contentful Paint (seconds)',
        db_index=True
    )
    fid = models.FloatField(
        help_text='First Input Delay (milliseconds)',
        db_index=True
    )
    cls = models.FloatField(
        help_text='Cumulative Layout Shift',
        db_index=True
    )
    
    # Additional Performance Metrics
    tti = models.FloatField(
        null=True, 
        blank=True, 
        help_text='Time to Interactive (seconds)'
    )
    tbt = models.FloatField(
        null=True, 
        blank=True, 
        help_text='Total Blocking Time (milliseconds)'
    )
    fcp = models.FloatField(
        null=True, 
        blank=True, 
        help_text='First Contentful Paint (seconds)'
    )
    speed_index = models.FloatField(
        null=True,
        blank=True,
        help_text='Speed Index (seconds)'
    )
    
    # Resource Metrics
    page_size_mb = models.FloatField(
        null=True, 
        blank=True, 
        help_text='Total page size in MB',
        db_index=True
    )
    request_count = models.IntegerField(
        null=True, 
        blank=True, 
        help_text='Number of HTTP requests'
    )
    load_time = models.FloatField(
        null=True, 
        blank=True, 
        help_text='Total load time in seconds'
    )
    
    # Timeline Metrics
    dom_content_loaded = models.FloatField(
        null=True,
        blank=True,
        help_text='DOM Content Loaded time (ms)'
    )
    first_paint = models.FloatField(
        null=True,
        blank=True,
        help_text='First Paint time (ms)'
    )
    
    # Lighthouse Category Scores
    accessibility_score = models.IntegerField(
        null=True,
        blank=True,
        help_text='Lighthouse accessibility score (0-100)'
    )
    best_practices_score = models.IntegerField(
        null=True,
        blank=True,
        help_text='Lighthouse best practices score (0-100)'
    )
    seo_score = models.IntegerField(
        null=True,
        blank=True,
        help_text='Lighthouse SEO score (0-100)'
    )
    
    # Resources breakdown (stored as JSON for flexibility)
    resources = models.JSONField(
        default=list,
        blank=True,
        help_text='List of resources with size, type, load time'
    )
    
    # Recommendations
    recommendations = models.JSONField(
        default=list,
        blank=True,
        help_text='List of performance recommendations'
    )
    
    # Full Lighthouse results (for detailed analysis)
    full_results = models.JSONField(
        default=dict,
        blank=True,
        help_text='Complete Lighthouse results JSON'
    )
    
    # Historical tracking metadata
    is_baseline = models.BooleanField(
        default=False,
        help_text='True if this is marked as a baseline for comparison'
    )
    baseline_id = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='comparisons',
        help_text='Reference to baseline analysis for comparison'
    )
    
    # Change tracking (calculated fields for quick access)
    score_change = models.IntegerField(
        null=True,
        blank=True,
        help_text='Change in performance score from previous analysis'
    )
    lcp_change = models.FloatField(
        null=True,
        blank=True,
        help_text='Change in LCP from previous analysis (seconds)'
    )
    
    # Timestamps
    analyzed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='When this analysis was performed'
    )
    
    class Meta:
        db_table = 'performance_analysis'
        ordering = ['-analyzed_at']
        indexes = [
            models.Index(fields=['url', '-analyzed_at']),
            models.Index(fields=['url', 'device', '-analyzed_at']),
            models.Index(fields=['user', '-analyzed_at']),
            models.Index(fields=['audit_report', '-analyzed_at']),
            models.Index(fields=['performance_score']),
            models.Index(fields=['lcp']),
            models.Index(fields=['-analyzed_at']),
        ]
        verbose_name = 'Performance Analysis'
        verbose_name_plural = 'Performance Analyses'
    
    def __str__(self):
        device_str = f" ({self.device})" if self.device else ""
        return f"{self.url}{device_str} - Score: {self.performance_score} at {self.analyzed_at}"
    
    def get_previous_analysis(self):
        """Get the previous analysis for the same URL and device"""
        return PerformanceAnalysis.objects.filter(
            url=self.url,
            device=self.device,
            analyzed_at__lt=self.analyzed_at
        ).order_by('-analyzed_at').first()
    
    def calculate_changes(self):
        """Calculate changes from previous analysis"""
        previous = self.get_previous_analysis()
        if previous:
            self.score_change = self.performance_score - previous.performance_score
            self.lcp_change = self.lcp - previous.lcp
            self.save(update_fields=['score_change', 'lcp_change'])


class PerformanceHistory(models.Model):
    """
    Aggregated performance history for efficient chart rendering.
    
    Stores daily/hourly aggregates to reduce data volume while maintaining
    chart accuracy for historical trend visualization.
    """
    url = models.URLField(max_length=2048, db_index=True)
    device = models.CharField(max_length=10, choices=PerformanceAnalysis.DEVICE_CHOICES)
    date = models.DateField(db_index=True)
    hour = models.IntegerField(
        null=True,
        blank=True,
        help_text='Hour of day (0-23) for hourly aggregates, null for daily'
    )
    
    # Aggregated metrics
    avg_score = models.FloatField(help_text='Average performance score')
    min_score = models.IntegerField(help_text='Minimum performance score')
    max_score = models.IntegerField(help_text='Maximum performance score')
    
    avg_lcp = models.FloatField(help_text='Average LCP (seconds)')
    avg_fid = models.FloatField(help_text='Average FID (milliseconds)')
    avg_cls = models.FloatField(help_text='Average CLS')
    
    avg_page_size_mb = models.FloatField(null=True, blank=True)
    avg_request_count = models.FloatField(null=True, blank=True)
    avg_load_time = models.FloatField(null=True, blank=True)
    
    # Count
    analysis_count = models.IntegerField(help_text='Number of analyses in this period')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'performance_history'
        ordering = ['-date', '-hour']
        unique_together = [('url', 'device', 'date', 'hour')]
        indexes = [
            models.Index(fields=['url', 'device', '-date']),
        ]
        verbose_name = 'Performance History'
        verbose_name_plural = 'Performance Histories'
    
    def __str__(self):
        period = f"{self.date} {self.hour:02d}:00" if self.hour is not None else str(self.date)
        return f"{self.url} ({self.device}) - {period} - Avg Score: {self.avg_score}"


class NetworkRequest(models.Model):
    """
    Individual network request for waterfall chart visualization.
    One PerformanceAnalysis has many NetworkRequests.
    """
    performance_analysis = models.ForeignKey(
        PerformanceAnalysis,
        on_delete=models.CASCADE,
        related_name='network_requests',
        db_index=True
    )
    # Direct link to audit report for easier querying
    audit_report = models.ForeignKey(
        'audit_reports.AuditReport',
        on_delete=models.CASCADE,
        related_name='network_requests',
        null=True,
        blank=True,
        db_index=True,
        help_text='Direct link to audit report for easier querying'
    )
    
    # Resource identification
    url = models.URLField(max_length=2048, db_index=True)
    resource_type = models.CharField(max_length=50, help_text='document, script, stylesheet, image, font, etc.')
    mime_type = models.CharField(max_length=100, null=True, blank=True, help_text='MIME type (e.g., application/javascript)')
    
    # Size information
    transfer_size = models.IntegerField(help_text='Actual bytes transferred (compressed)')
    resource_size = models.IntegerField(help_text='Uncompressed resource size')
    compression_ratio = models.FloatField(null=True, blank=True, help_text='Compression ratio')
    
    # Status
    status_code = models.IntegerField(null=True, blank=True)
    protocol = models.CharField(max_length=20, null=True, blank=True, help_text='http/1.1, http/2, h3, etc.')
    
    # Timing (in milliseconds)
    start_time = models.FloatField(help_text='Request start time (ms)')
    end_time = models.FloatField(help_text='Request end time (ms)')
    duration = models.FloatField(help_text='Total duration (ms)')
    
    # Detailed timing breakdown
    dns_time = models.FloatField(null=True, blank=True, help_text='DNS lookup time (ms)')
    ssl_time = models.FloatField(null=True, blank=True, help_text='SSL negotiation time (ms)')
    connect_time = models.FloatField(null=True, blank=True, help_text='TCP connect time (ms)')
    send_time = models.FloatField(null=True, blank=True, help_text='Request send time (ms)')
    wait_time = models.FloatField(null=True, blank=True, help_text='Server wait time (ms)')
    receive_time = models.FloatField(null=True, blank=True, help_text='Response receive time (ms)')
    
    # Priority and blocking
    priority = models.CharField(max_length=20, null=True, blank=True, help_text='High, Medium, Low, VeryLow')
    render_blocking_status = models.CharField(max_length=50, null=True, blank=True, help_text='blocking, non-blocking, potentially-blocking')
    
    # Initiator
    initiator_type = models.CharField(max_length=50, null=True, blank=True, help_text='parser, script, preload, etc.')
    initiator_url = models.URLField(max_length=2048, null=True, blank=True, help_text='URL that initiated this request')
    
    # Additional metadata
    from_cache = models.BooleanField(default=False)
    from_service_worker = models.BooleanField(default=False)
    
    # Ordering for waterfall display
    sequence = models.IntegerField(help_text='Order in which request was made (for waterfall)')
    
    class Meta:
        db_table = 'network_request'
        ordering = ['performance_analysis', 'sequence', 'start_time']
        indexes = [
            models.Index(fields=['performance_analysis', 'start_time']),
            models.Index(fields=['performance_analysis', 'resource_type']),
            models.Index(fields=['url', '-start_time']),
        ]
        verbose_name = 'Network Request'
        verbose_name_plural = 'Network Requests'
    
    def __str__(self):
        return f"{self.url} - {self.duration}ms ({self.resource_type})"


class ResourceBreakdown(models.Model):
    """
    Detailed resource breakdown for analysis.
    One PerformanceAnalysis has many ResourceBreakdowns.
    """
    RESOURCE_CATEGORY_CHOICES = [
        ('document', 'Document'),
        ('script', 'Script'),
        ('stylesheet', 'Stylesheet'),
        ('image', 'Image'),
        ('font', 'Font'),
        ('media', 'Media'),
        ('other', 'Other'),
    ]
    
    performance_analysis = models.ForeignKey(
        PerformanceAnalysis,
        on_delete=models.CASCADE,
        related_name='resource_breakdowns',
        db_index=True
    )
    # Direct link to audit report for easier querying
    audit_report = models.ForeignKey(
        'audit_reports.AuditReport',
        on_delete=models.CASCADE,
        related_name='resource_breakdowns',
        null=True,
        blank=True,
        db_index=True,
        help_text='Direct link to audit report for easier querying'
    )
    
    # Resource identification
    url = models.URLField(max_length=2048, db_index=True)
    resource_type = models.CharField(max_length=50)
    category = models.CharField(max_length=20, choices=RESOURCE_CATEGORY_CHOICES, db_index=True)
    mime_type = models.CharField(max_length=100, null=True, blank=True, help_text='MIME type (e.g., application/javascript)')
    
    # Size metrics
    transfer_size = models.IntegerField(help_text='Compressed size (bytes)')
    resource_size = models.IntegerField(help_text='Uncompressed size (bytes)')
    gzip_savings = models.IntegerField(null=True, blank=True, help_text='Bytes saved by compression')
    
    # Optimization metrics (from audits)
    wasted_bytes = models.IntegerField(null=True, blank=True, help_text='Wasted bytes (from unused-css/js audits)')
    wasted_ms = models.FloatField(null=True, blank=True, help_text='Wasted milliseconds')
    cache_lifetime = models.IntegerField(null=True, blank=True, help_text='Cache lifetime in seconds')
    
    # Performance impact
    render_blocking = models.BooleanField(default=False, db_index=True, help_text='Is this resource render-blocking?')
    unused_css = models.BooleanField(default=False, help_text='Is unused CSS detected?')
    unused_javascript = models.BooleanField(default=False, help_text='Is unused JavaScript detected?')
    
    # Optimization flags
    can_minify = models.BooleanField(default=False, help_text='Can this resource be minified?')
    can_compress = models.BooleanField(default=False, help_text='Can this resource be compressed?')
    can_cache = models.BooleanField(default=False, help_text='Can this resource be cached?')
    
    # Load time
    load_time = models.FloatField(null=True, blank=True, help_text='Resource load time (ms)')
    
    class Meta:
        db_table = 'resource_breakdown'
        ordering = ['performance_analysis', '-transfer_size']
        indexes = [
            models.Index(fields=['performance_analysis', 'category']),
            models.Index(fields=['performance_analysis', 'render_blocking']),
        ]
        verbose_name = 'Resource Breakdown'
        verbose_name_plural = 'Resource Breakdowns'
    
    def __str__(self):
        return f"{self.url} - {self.category} ({self.transfer_size} bytes)"


class PerformanceTimelineEvent(models.Model):
    """
    Individual performance timeline event.
    One PerformanceAnalysis has many PerformanceTimelineEvents.
    """
    EVENT_CATEGORY_CHOICES = [
        ('navigation', 'Navigation'),
        ('paint', 'Paint'),
        ('measure', 'Measure'),
        ('mark', 'Mark'),
        ('script', 'Script'),
        ('layout', 'Layout'),
        ('other', 'Other'),
    ]
    
    EVENT_PHASE_CHOICES = [
        ('B', 'Begin'),
        ('E', 'End'),
        ('I', 'Instant'),
        ('X', 'Complete'),
    ]
    
    performance_analysis = models.ForeignKey(
        PerformanceAnalysis,
        on_delete=models.CASCADE,
        related_name='timeline_events',
        db_index=True
    )
    # Direct link to audit report for easier querying
    audit_report = models.ForeignKey(
        'audit_reports.AuditReport',
        on_delete=models.CASCADE,
        related_name='timeline_events',
        null=True,
        blank=True,
        db_index=True,
        help_text='Direct link to audit report for easier querying'
    )
    
    # Event identification
    name = models.CharField(max_length=255, db_index=True, help_text='Event name')
    category = models.CharField(max_length=20, choices=EVENT_CATEGORY_CHOICES, db_index=True)
    
    # Timing
    timestamp = models.FloatField(help_text='Event timestamp (microseconds)')
    duration = models.FloatField(null=True, blank=True, help_text='Event duration (microseconds)')
    phase = models.CharField(max_length=1, choices=EVENT_PHASE_CHOICES, help_text='Event phase')
    
    # Process/Thread info
    pid = models.IntegerField(null=True, blank=True, help_text='Process ID')
    tid = models.IntegerField(null=True, blank=True, help_text='Thread ID')
    
    # Ordering
    sequence = models.IntegerField(help_text='Order in timeline')
    
    # Additional data (stores args from traceEvents)
    data = models.JSONField(default=dict, blank=True, help_text='Additional event data (args from traceEvents)')
    
    class Meta:
        db_table = 'performance_timeline_event'
        ordering = ['performance_analysis', 'timestamp', 'sequence']
        indexes = [
            models.Index(fields=['performance_analysis', 'timestamp']),
            models.Index(fields=['performance_analysis', 'category']),
        ]
        verbose_name = 'Performance Timeline Event'
        verbose_name_plural = 'Performance Timeline Events'
    
    def __str__(self):
        return f"{self.name} - {self.category} at {self.timestamp}μs"

