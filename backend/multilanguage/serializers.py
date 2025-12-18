from rest_framework import serializers
from .models import PageTranslationStatus


class PageTranslationStatusSerializer(serializers.ModelSerializer):
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = PageTranslationStatus
        fields = [
            'id',
            'page_route',
            'component_path',
            'page_type',
            'status',
            'auto_discovered',
            'last_checked',
            'last_updated',
            'created_at',
            'updated_by',
            'updated_by_username',
            'notes',
        ]
        read_only_fields = ['id', 'created_at', 'last_checked', 'last_updated']

