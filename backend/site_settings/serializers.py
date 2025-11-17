from rest_framework import serializers
from .models import ThemePalette, TypographyPreset, SiteConfig


class ThemePaletteSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = ThemePalette
        fields = [
            'id',
            'name',
            'description',
            'primary_color',
            'secondary_color',
            'accent_1',
            'accent_2',
            'accent_3',
            'is_active',
            'is_system',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_by_username', 'created_at', 'updated_at']
    
    def validate(self, data):
        # Prevent modification of system palettes
        if self.instance and self.instance.is_system:
            if 'is_system' in data and not data['is_system']:
                raise serializers.ValidationError("Cannot modify system palette status")
        return data


class ThemePaletteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThemePalette
        fields = [
            'name',
            'description',
            'primary_color',
            'secondary_color',
            'accent_1',
            'accent_2',
            'accent_3',
        ]


class ThemePaletteUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThemePalette
        fields = [
            'name',
            'description',
            'primary_color',
            'secondary_color',
            'accent_1',
            'accent_2',
            'accent_3',
        ]
    
    def validate(self, data):
        # Prevent modification of system palettes
        if self.instance and self.instance.is_system:
            raise serializers.ValidationError("System palettes cannot be modified")
        return data


class TypographyPresetSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = TypographyPreset
        fields = [
            'id',
            'name',
            'description',
            'body_font',
            'heading_font',
            'font_size_base',
            'font_size_h1',
            'font_size_h2',
            'font_size_h3',
            'font_size_h4',
            'font_size_h5',
            'font_size_h6',
            'line_height_base',
            'is_active',
            'is_system',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_by_username', 'created_at', 'updated_at']


class TypographyPresetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypographyPreset
        fields = [
            'name',
            'description',
            'body_font',
            'heading_font',
            'font_size_base',
            'font_size_h1',
            'font_size_h2',
            'font_size_h3',
            'font_size_h4',
            'font_size_h5',
            'font_size_h6',
            'line_height_base',
        ]


class TypographyPresetUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypographyPreset
        fields = [
            'name',
            'description',
            'body_font',
            'heading_font',
            'font_size_base',
            'font_size_h1',
            'font_size_h2',
            'font_size_h3',
            'font_size_h4',
            'font_size_h5',
            'font_size_h6',
            'line_height_base',
        ]
    
    def validate(self, data):
        # Prevent modification of system presets
        if self.instance and self.instance.is_system:
            raise serializers.ValidationError("System typography presets cannot be modified")
        return data


class SiteConfigSerializer(serializers.ModelSerializer):
    active_palette_details = ThemePaletteSerializer(source='active_palette', read_only=True)
    active_typography_details = TypographyPresetSerializer(source='active_typography', read_only=True)
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)
    
    class Meta:
        model = SiteConfig
        fields = [
            'id',
            'site_name',
            'site_description',
            'default_language',
            'default_theme',
            'active_palette',
            'active_palette_details',
            'active_typography',
            'active_typography_details',
            'session_timeout_minutes',
            'max_login_attempts',
            'require_strong_passwords',
            'enable_two_factor',
            'enable_email_verification',
            'enable_analytics',
            'enable_email_notifications',
            'enable_push_notifications',
            'enable_sms_notifications',
            'notification_email',
            'api_base_url',
            'api_rate_limit',
            'enable_cors',
            'enable_api_docs',
            'updated_by',
            'updated_by_username',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_by', 'updated_by_username', 'updated_at']

