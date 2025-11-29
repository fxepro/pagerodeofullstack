"""
Typography Analysis Database Models

This module contains models for storing typography analysis results.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class TypographyAnalysis(models.Model):
    """
    Typography analysis results for a webpage.
    """
    # URL and user association
    url = models.URLField(max_length=2048, db_index=True, help_text='Page URL that was analyzed')
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='typography_analyses',
        help_text='User who ran this analysis (null for anonymous)'
    )
    # Link to audit report (if part of a full audit)
    audit_report = models.ForeignKey(
        'audit_reports.AuditReport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='typography_analyses',
        help_text='Audit report this analysis belongs to (if part of full audit)',
        db_index=True
    )
    
    # Font analysis
    fonts_used = models.JSONField(
        default=list,
        blank=True,
        help_text='List of fonts used on the page'
    )
    font_sizes = models.JSONField(
        default=list,
        blank=True,
        help_text='List of font sizes found'
    )
    font_weights = models.JSONField(
        default=list,
        blank=True,
        help_text='List of font weights used'
    )
    line_heights = models.JSONField(
        default=list,
        blank=True,
        help_text='List of line heights used'
    )
    font_families = models.JSONField(
        default=list,
        blank=True,
        help_text='List of font families used'
    )
    
    # Typography metrics
    total_fonts = models.IntegerField(
        null=True,
        blank=True,
        help_text='Total number of unique fonts used'
    )
    total_font_sizes = models.IntegerField(
        null=True,
        blank=True,
        help_text='Total number of unique font sizes'
    )
    min_font_size = models.FloatField(
        null=True,
        blank=True,
        help_text='Minimum font size (px)'
    )
    max_font_size = models.FloatField(
        null=True,
        blank=True,
        help_text='Maximum font size (px)'
    )
    avg_font_size = models.FloatField(
        null=True,
        blank=True,
        help_text='Average font size (px)'
    )
    
    # Typography issues
    issues = models.JSONField(
        default=list,
        blank=True,
        help_text='List of typography issues found (e.g., too many fonts, small text)'
    )
    recommendations = models.JSONField(
        default=list,
        blank=True,
        help_text='List of typography recommendations'
    )
    health_score = models.IntegerField(
        null=True,
        blank=True,
        help_text='Typography health score (0-100)'
    )
    
    # Accessibility concerns
    accessibility_issues = models.JSONField(
        default=list,
        blank=True,
        help_text='Typography-related accessibility issues'
    )
    
    # Full results
    full_results = models.JSONField(
        default=dict,
        blank=True,
        help_text='Complete typography analysis results'
    )
    
    # Timestamps
    analyzed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='When this analysis was performed'
    )
    
    class Meta:
        db_table = 'typography_analysis'
        ordering = ['-analyzed_at']
        indexes = [
            models.Index(fields=['url', '-analyzed_at']),
            models.Index(fields=['user', '-analyzed_at']),
            models.Index(fields=['audit_report', '-analyzed_at']),
        ]
        verbose_name = 'Typography Analysis'
        verbose_name_plural = 'Typography Analyses'
    
    def __str__(self):
        return f"{self.url} - Typography Analysis at {self.analyzed_at}"

