from django.contrib import admin
from .models import ThemePalette, TypographyPreset, SiteConfig


@admin.register(ThemePalette)
class ThemePaletteAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'primary_color',
        'secondary_color',
        'is_active',
        'is_system',
        'created_by',
        'created_at'
    ]
    list_filter = ['is_active', 'is_system', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_by', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'is_active', 'is_system')
        }),
        ('Colors', {
            'fields': (
                'primary_color',
                'secondary_color',
                'accent_1',
                'accent_2',
                'accent_3'
            )
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(TypographyPreset)
class TypographyPresetAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'body_font',
        'font_size_base',
        'is_active',
        'is_system',
        'created_by',
        'created_at'
    ]
    list_filter = ['is_active', 'is_system', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_by', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'is_active', 'is_system')
        }),
        ('Font Families', {
            'fields': ('body_font', 'heading_font')
        }),
        ('Font Sizes', {
            'fields': (
                'font_size_base',
                ('font_size_h1', 'font_size_h2'),
                ('font_size_h3', 'font_size_h4'),
                ('font_size_h5', 'font_size_h6'),
                'line_height_base',
            )
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(SiteConfig)
class SiteConfigAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        # Only allow one instance
        return not SiteConfig.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Don't allow deletion of config
        return False
    
    fieldsets = (
        ('General Settings', {
            'fields': ('site_name', 'site_description', 'default_language')
        }),
        ('Theme Settings', {
            'fields': ('default_theme', 'active_palette', 'active_typography'),
            'description': 'Select active color palette and typography preset'
        }),
        ('Security Settings', {
            'fields': (
                'session_timeout_minutes',
                'max_login_attempts',
                'require_strong_passwords',
                'enable_two_factor',
                'enable_email_verification'
            )
        }),
        ('Notification Settings', {
            'fields': (
                'enable_email_notifications',
                'enable_push_notifications',
                'enable_sms_notifications',
                'notification_email'
            )
        }),
        ('API Settings', {
            'fields': (
                'api_base_url',
                'api_rate_limit',
                'enable_cors',
                'enable_api_docs'
            )
        }),
        ('Metadata', {
            'fields': ('updated_by', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['updated_by', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

