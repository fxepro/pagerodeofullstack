from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User


class TypographyPreset(models.Model):
    """
    Store typography presets for the application.
    Only one preset can be active at a time.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Preset name (e.g., 'Compact', 'Comfortable', 'Large')"
    )
    description = models.TextField(
        blank=True,
        help_text="Brief description of this typography preset"
    )
    
    # Font Families
    body_font = models.CharField(
        max_length=200,
        default='Inter, system-ui, -apple-system, sans-serif',
        help_text='Font family for body text'
    )
    heading_font = models.CharField(
        max_length=200,
        default='Inter, system-ui, -apple-system, sans-serif',
        help_text='Font family for all headings (H1-H6)'
    )
    
    # Font Sizes
    font_size_base = models.CharField(
        max_length=10,
        default='16px',
        help_text='Base font size for body text'
    )
    font_size_h1 = models.CharField(
        max_length=10,
        default='48px',
        help_text='H1 heading size'
    )
    font_size_h2 = models.CharField(
        max_length=10,
        default='36px',
        help_text='H2 heading size'
    )
    font_size_h3 = models.CharField(
        max_length=10,
        default='30px',
        help_text='H3 heading size'
    )
    font_size_h4 = models.CharField(
        max_length=10,
        default='24px',
        help_text='H4 heading size'
    )
    font_size_h5 = models.CharField(
        max_length=10,
        default='20px',
        help_text='H5 heading size'
    )
    font_size_h6 = models.CharField(
        max_length=10,
        default='18px',
        help_text='H6 heading size'
    )
    
    # Line Height
    line_height_base = models.CharField(
        max_length=10,
        default='1.6',
        help_text='Base line height (unitless or percentage)'
    )
    
    # Status
    is_active = models.BooleanField(
        default=False,
        help_text='Only one preset can be active at a time'
    )
    is_system = models.BooleanField(
        default=False,
        help_text='System presets cannot be deleted'
    )
    
    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_typography_presets'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_active', '-created_at']
        verbose_name = 'Typography Preset'
        verbose_name_plural = 'Typography Presets'
    
    def __str__(self):
        status = " (Active)" if self.is_active else ""
        return f"{self.name}{status}"
    
    def save(self, *args, **kwargs):
        # If this preset is being set to active, deactivate all others
        if self.is_active:
            TypographyPreset.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)
    
    def clean(self):
        # Prevent modification of system presets
        if self.is_system and self.pk:
            original = TypographyPreset.objects.get(pk=self.pk)
            if original.is_system and not self.is_system:
                raise ValidationError("Cannot remove system status from a system preset")


class ThemePalette(models.Model):
    """
    Store color palettes for the application.
    Only one palette can be active at a time.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Palette name (e.g., 'Ocean Blue', 'Forest Green')"
    )
    description = models.TextField(
        blank=True,
        help_text="Brief description of this color palette"
    )
    
    # Color validators - must be valid hex colors
    hex_validator = RegexValidator(
        regex='^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
        message='Enter a valid hex color code (e.g., #0086ad)'
    )
    
    # Primary colors
    primary_color = models.CharField(
        max_length=7,
        validators=[hex_validator],
        default='#0086ad',
        help_text='Primary brand color'
    )
    secondary_color = models.CharField(
        max_length=7,
        validators=[hex_validator],
        default='#005582',
        help_text='Secondary brand color'
    )
    
    # Accent colors
    accent_1 = models.CharField(
        max_length=7,
        validators=[hex_validator],
        default='#00c2c7',
        help_text='First accent color'
    )
    accent_2 = models.CharField(
        max_length=7,
        validators=[hex_validator],
        default='#97ebdb',
        help_text='Second accent color'
    )
    accent_3 = models.CharField(
        max_length=7,
        validators=[hex_validator],
        default='#daf8e3',
        help_text='Third accent color'
    )
    
    # Status
    is_active = models.BooleanField(
        default=False,
        help_text='Only one palette can be active at a time'
    )
    is_system = models.BooleanField(
        default=False,
        help_text='System palettes cannot be deleted'
    )
    
    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_palettes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_active', '-created_at']
        verbose_name = 'Theme Palette'
        verbose_name_plural = 'Theme Palettes'
    
    def __str__(self):
        status = " (Active)" if self.is_active else ""
        return f"{self.name}{status}"
    
    def save(self, *args, **kwargs):
        # If this palette is being set to active, deactivate all others
        if self.is_active:
            ThemePalette.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)
    
    def clean(self):
        # Prevent deletion of system palettes
        if self.is_system and self.pk:
            original = ThemePalette.objects.get(pk=self.pk)
            if original.is_system and not self.is_system:
                raise ValidationError("Cannot remove system status from a system palette")


class SiteConfig(models.Model):
    """
    Singleton model for site-wide configuration.
    Only one instance should exist.
    """
    
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('auto', 'Auto (System)'),
    ]
    
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('es', 'Spanish'),
        ('fr', 'French'),
    ]
    
    # General Settings
    site_name = models.CharField(
        max_length=100,
        default='PageRodeo',
        help_text='Site name displayed in header and emails'
    )
    site_description = models.TextField(
        default='A comprehensive web performance monitoring and analysis platform',
        help_text='Site description for meta tags'
    )
    default_language = models.CharField(
        max_length=5,
        choices=LANGUAGE_CHOICES,
        default='en',
        help_text='Default language for the application'
    )
    
    # Theme Settings
    default_theme = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='light',
        help_text='Default theme mode (light/dark/auto)'
    )
    active_palette = models.ForeignKey(
        ThemePalette,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='active_in_config',
        help_text='Currently active color palette'
    )
    active_typography = models.ForeignKey(
        TypographyPreset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='active_in_config',
        help_text='Currently active typography preset'
    )
    
    # Security Settings
    session_timeout_minutes = models.IntegerField(
        default=30,
        help_text='Session timeout in minutes'
    )
    max_login_attempts = models.IntegerField(
        default=5,
        help_text='Maximum failed login attempts before lockout'
    )
    require_strong_passwords = models.BooleanField(
        default=True,
        help_text='Enforce password complexity requirements'
    )
    enable_two_factor = models.BooleanField(
        default=False,
        help_text='Require 2FA for admin accounts'
    )
    enable_email_verification = models.BooleanField(
        default=False,
        help_text='Require email verification on registration'
    )
    
    # Notification Settings
    enable_email_notifications = models.BooleanField(
        default=True,
        help_text='Send notifications via email'
    )
    enable_push_notifications = models.BooleanField(
        default=True,
        help_text='Send browser push notifications'
    )
    enable_sms_notifications = models.BooleanField(
        default=False,
        help_text='Send notifications via SMS'
    )
    notification_email = models.EmailField(
        default='admin@pagerodeo.com',
        help_text='Email address for system notifications'
    )
    
    # API Settings
    api_base_url = models.URLField(
        default='http://localhost:8000',
        help_text='Base URL for API endpoints'
    )
    api_rate_limit = models.IntegerField(
        default=1000,
        help_text='API rate limit (requests per minute)'
    )
    enable_cors = models.BooleanField(
        default=True,
        help_text='Allow cross-origin requests'
    )
    enable_api_docs = models.BooleanField(
        default=True,
        help_text='Expose API documentation endpoint'
    )
    
    # Analytics Settings
    enable_analytics = models.BooleanField(
        default=False,
        help_text='Enable client-side analytics (PostHog) in production'
    )
    
    # Metadata
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='config_updates'
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Site Configuration'
        verbose_name_plural = 'Site Configuration'
    
    def __str__(self):
        return f"{self.site_name} Configuration"
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists (Singleton pattern)
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get_config(cls):
        """Get or create the singleton config instance"""
        config, created = cls.objects.get_or_create(pk=1)
        return config

