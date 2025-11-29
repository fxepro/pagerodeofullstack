"""
Admin API Monitoring Models
"""

from django.db import models
from django.utils import timezone


class APIEndpoint(models.Model):
    """
    API endpoints to monitor
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
    
    name = models.CharField(max_length=200, help_text='Display name for this API')
    url = models.URLField(max_length=500, help_text='Full API endpoint URL')
    method = models.CharField(max_length=10, choices=METHOD_CHOICES, default='GET')
    expected_status_code = models.IntegerField(default=200, help_text='Expected HTTP status code')
    timeout_seconds = models.IntegerField(default=10, help_text='Request timeout in seconds')
    check_interval_minutes = models.IntegerField(default=5, help_text='How often to check (minutes)')
    is_active = models.BooleanField(default=True, help_text='Enable/disable monitoring')
    requires_auth = models.BooleanField(default=False, help_text='Requires authentication')
    auth_token = models.CharField(max_length=500, null=True, blank=True, help_text='Auth token if needed')
    headers = models.JSONField(null=True, blank=True, help_text='Custom headers as JSON')
    body = models.TextField(null=True, blank=True, help_text='Request body for POST/PUT')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'API Endpoint'
        verbose_name_plural = 'API Endpoints'
    
    def __str__(self):
        return f"{self.name} ({self.method} {self.url})"


class APICheck(models.Model):
    """
    Results of each API check
    """
    endpoint = models.ForeignKey(
        APIEndpoint,
        on_delete=models.CASCADE,
        related_name='checks',
        help_text='API endpoint that was checked'
    )
    status_code = models.IntegerField(null=True, blank=True, help_text='Actual HTTP status code')
    response_time_ms = models.FloatField(help_text='Response time in milliseconds')
    is_success = models.BooleanField(help_text='Status matches expected?')
    response_body = models.TextField(null=True, blank=True, help_text='Response body (truncated if too long)')
    error_message = models.TextField(null=True, blank=True, help_text='Error message if failed')
    checked_at = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        ordering = ['-checked_at']
        indexes = [
            models.Index(fields=['endpoint', '-checked_at']),
            models.Index(fields=['is_success', '-checked_at']),
        ]
        verbose_name = 'API Check'
        verbose_name_plural = 'API Checks'
        app_label = 'api_monitoring'
    
    def __str__(self):
        status = '✅' if self.is_success else '❌'
        return f"{status} {self.endpoint.name} - {self.status_code} ({self.response_time_ms}ms)"


class APIAlert(models.Model):
    """
    Alerts when APIs fail
    """
    ALERT_TYPE_CHOICES = [
        ('down', 'API Down'),
        ('slow', 'Slow Response'),
        ('unexpected_status', 'Unexpected Status'),
        ('timeout', 'Timeout'),
        ('error', 'Error'),
    ]
    
    endpoint = models.ForeignKey(
        APIEndpoint,
        on_delete=models.CASCADE,
        related_name='alerts',
        help_text='API endpoint that triggered alert'
    )
    api_check = models.ForeignKey(
        APICheck,
        on_delete=models.CASCADE,
        related_name='alerts',
        help_text='Check that triggered this alert'
    )
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPE_CHOICES, help_text='Type of alert')
    message = models.TextField(help_text='Alert message')
    is_resolved = models.BooleanField(default=False, help_text='Is this alert resolved?')
    resolved_at = models.DateTimeField(null=True, blank=True, help_text='When was this resolved?')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_resolved', '-created_at']),
        ]
        verbose_name = 'API Alert'
        verbose_name_plural = 'API Alerts'
        app_label = 'api_monitoring'
    
    def __str__(self):
        status = '🔴' if not self.is_resolved else '✅'
        return f"{status} {self.endpoint.name} - {self.alert_type}"

