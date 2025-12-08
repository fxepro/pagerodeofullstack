"""
Feature Permission Models

Maps features to Django permissions for easier RBAC management.
"""

from django.db import models
from django.contrib.auth.models import Permission


class FeaturePermission(models.Model):
    """
    Maps features to permissions for easier management.
    This model provides a human-readable way to manage permissions
    and link them to specific features in the workspace.
    """
    FEATURE_CATEGORIES = [
        ('workspace', 'Workspace'),
        ('user_features', 'User Features'),
        ('admin_features', 'Admin Features'),
        ('account', 'Account'),
    ]
    
    code = models.CharField(
        max_length=100, 
        unique=True,
        help_text='Permission code (e.g., "site_audit.view")'
    )
    name = models.CharField(
        max_length=200,
        help_text='Human-readable permission name (e.g., "View Site Audits")'
    )
    description = models.TextField(
        blank=True,
        help_text='Detailed description of what this permission allows'
    )
    category = models.CharField(
        max_length=50, 
        choices=FEATURE_CATEGORIES,
        help_text='Category this permission belongs to'
    )
    django_permission = models.ForeignKey(
        Permission, 
        on_delete=models.CASCADE,
        related_name='feature_permissions',
        null=True,
        blank=True,
        help_text='Linked Django permission (optional, for integration)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'code']
        verbose_name = 'Feature Permission'
        verbose_name_plural = 'Feature Permissions'
    
    def __str__(self):
        return f"{self.name} ({self.code})"

