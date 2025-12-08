from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class EmailCapture(models.Model):
    """Model to capture all email submissions from various forms"""
    
    FORM_TYPES = [
        ('contact', 'Contact Form'),
        ('feedback', 'Feedback Form'),
        ('consultation', 'Consultation Form'),
        ('update_signup', 'Update Signup'),
        ('demo_request', 'Demo Request'),
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

class Feedback(models.Model):
    """Model for user feedback submissions"""
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('reviewed', 'Reviewed'),
        ('responded', 'Responded'),
        ('archived', 'Archived'),
    ]
    
    user_email = models.EmailField(
        null=True,
        blank=True,
        help_text="User's email address (optional)"
    )
    rating = models.IntegerField(
        help_text="Rating from 1 to 5",
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    great_work = models.TextField(
        blank=True,
        help_text="What did we do great?"
    )
    could_be_better = models.TextField(
        blank=True,
        help_text="What could be better?"
    )
    remove_and_relish = models.TextField(
        blank=True,
        help_text="What should we remove and relish?"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        help_text="Current status of the feedback"
    )
    admin_notes = models.TextField(
        blank=True,
        help_text="Internal admin notes about this feedback"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the user who submitted the feedback"
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        help_text="When this feedback was submitted"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this feedback was last updated"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this feedback was reviewed"
    )
    responded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When a response was sent to the user"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Feedback"
        verbose_name_plural = "Feedback"
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
            models.Index(fields=['user_email']),
        ]

    def __str__(self):
        email_display = self.user_email or "Anonymous"
        return f"{email_display} - {self.rating}/5 ({self.created_at.strftime('%Y-%m-%d %H:%M')})"