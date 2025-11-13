from django.db import models
from django.utils import timezone

class EmailCapture(models.Model):
    """Model to capture all email submissions from various forms"""
    
    FORM_TYPES = [
        ('contact', 'Contact Form'),
        ('feedback', 'Feedback Form'),
        ('consultation', 'Consultation Form'),
        ('update_signup', 'Update Signup'),
    ]
    
    email = models.EmailField(help_text="User's email address")
    form_type = models.CharField(
        max_length=20, 
        choices=FORM_TYPES,
        help_text="Type of form that captured this email"
    )
    metadata = models.JSONField(
        default=dict,
        help_text="Additional form data (name, role, message, etc.)"
    )
    ip_address = models.GenericIPAddressField(
        null=True, 
        blank=True,
        help_text="IP address of the user who submitted the form"
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        help_text="When this email was captured"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this email capture is still active"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Email Capture"
        verbose_name_plural = "Email Captures"
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['form_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.email} - {self.get_form_type_display()} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

class UpdateSignup(models.Model):
    """Model specifically for tracking update signups by role"""
    
    ROLE_CHOICES = [
        ('Analyst', 'Analyst'),
        ('Manager', 'Manager'),
        ('Director', 'Director'),
    ]
    
    email = models.EmailField(help_text="User's email address")
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        help_text="Role the user is interested in (Analyst, Manager, Director)"
    )
    source = models.CharField(
        max_length=100,
        default="upgrade_page",
        help_text="Where this signup came from"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the user"
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        help_text="When this signup occurred"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this signup is still active"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Update Signup"
        verbose_name_plural = "Update Signups"
        unique_together = ['email', 'role']  # Prevent duplicate signups for same role
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.email} - {self.role} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
