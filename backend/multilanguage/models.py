from django.db import models
from django.utils import timezone


class PageTranslationStatus(models.Model):
    """
    Tracks translation implementation status for each page/route in the app
    """
    STATUS_CHOICES = [
        ('implemented', 'Implemented'),
        ('partial', 'Partial'),
        ('not-implemented', 'Not Implemented'),
    ]
    
    PAGE_TYPE_CHOICES = [
        ('public', 'Public'),
        ('workspace', 'Workspace'),
        ('admin', 'Admin'),
        ('dashboard', 'Dashboard'),
        ('component', 'Component'),
        ('api', 'API'),
    ]
    
    # Page identification
    page_route = models.CharField(max_length=500, unique=True, help_text='Page route (e.g., /workspace/users)')
    component_path = models.CharField(max_length=500, help_text='Component file path (e.g., studio/app/workspace/users/page.tsx)')
    page_type = models.CharField(max_length=20, choices=PAGE_TYPE_CHOICES, default='workspace')
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not-implemented')
    
    # Metadata
    auto_discovered = models.BooleanField(default=True, help_text='Whether this page was auto-discovered')
    last_checked = models.DateTimeField(auto_now=True, help_text='Last time the page was checked')
    last_updated = models.DateTimeField(auto_now=True, help_text='Last time the status was updated')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Admin tracking
    updated_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_translation_pages',
        help_text='User who last updated this status'
    )
    
    # Notes
    notes = models.TextField(blank=True, help_text='Admin notes about translation status')
    
    class Meta:
        ordering = ['page_type', 'page_route']
        verbose_name = 'Page Translation Status'
        verbose_name_plural = 'Page Translation Statuses'
        indexes = [
            models.Index(fields=['page_route']),
            models.Index(fields=['status']),
            models.Index(fields=['page_type']),
        ]
    
    def __str__(self):
        return f"{self.page_route} - {self.get_status_display()}"
