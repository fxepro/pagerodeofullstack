from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
import uuid


class AuditReport(models.Model):
    """
    Store audit report metadata and results.
    PDFs are generated asynchronously and stored in /public/reports/
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('ready', 'Ready'),
        ('failed', 'Failed'),
    ]
    
    # Primary Key
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='Unique identifier for this report'
    )
    
    # User Association
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='audit_reports',
        help_text='User who requested this report'
    )
    
    # Audit Details
    url = models.URLField(
        max_length=500,
        help_text='URL that was audited'
    )
    tools_selected = ArrayField(
        models.CharField(max_length=50),
        help_text='List of audit tools that were run'
    )
    
    # Store audit data for PDF generation and retry capability
    audit_data = models.JSONField(
        null=True,
        blank=True,
        help_text='Complete audit results data'
    )
    
    # Status and Results
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text='Current status of report generation'
    )
    pdf_url = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        help_text='Relative URL to generated PDF file'
    )
    file_size_bytes = models.BigIntegerField(
        null=True,
        blank=True,
        help_text='Size of generated PDF in bytes'
    )
    error_message = models.TextField(
        null=True,
        blank=True,
        help_text='Error message if generation failed'
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='When the report was requested'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When PDF generation completed'
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When this report will be automatically deleted'
    )
    
    class Meta:
        db_table = 'audit_reports'  # Override Django's default naming
        ordering = ['-created_at']
        verbose_name = 'Audit Report'
        verbose_name_plural = 'Audit Reports'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.url} - {self.get_status_display()} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
    
    @property
    def file_size_mb(self):
        """Return file size in MB"""
        if self.file_size_bytes:
            return round(self.file_size_bytes / 1024 / 1024, 2)
        return None
    
    @property
    def duration_seconds(self):
        """Calculate generation duration in seconds"""
        if self.completed_at and self.created_at:
            delta = self.completed_at - self.created_at
            return round(delta.total_seconds())
        return None
    
    @property
    def tools_count(self):
        """Return number of tools selected"""
        return len(self.tools_selected) if self.tools_selected else 0

