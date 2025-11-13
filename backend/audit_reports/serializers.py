from rest_framework import serializers
from .models import AuditReport


class AuditReportSerializer(serializers.ModelSerializer):
    """Serializer for audit report list/detail views"""
    
    file_size_mb = serializers.ReadOnlyField()
    duration_seconds = serializers.ReadOnlyField()
    tools_count = serializers.ReadOnlyField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    audit_data = serializers.JSONField(read_only=True)
    
    class Meta:
        model = AuditReport
        fields = [
            'id',
            'user',
            'user_email',
            'url',
            'tools_selected',
            'tools_count',
            'audit_data',
            'status',
            'pdf_url',
            'file_size_bytes',
            'file_size_mb',
            'error_message',
            'created_at',
            'completed_at',
            'expires_at',
            'duration_seconds'
        ]
        read_only_fields = [
            'id',
            'user',
            'status',
            'pdf_url',
            'file_size_bytes',
            'error_message',
            'created_at',
            'completed_at'
        ]


class AuditReportCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new audit reports"""
    
    class Meta:
        model = AuditReport
        fields = [
            'url',
            'tools_selected',
            'audit_data'
        ]
    
    def create(self, validated_data):
        # Set user from request context
        user = self.context['request'].user
        
        # If user is not authenticated, use the first superuser (for testing)
        if not user or not user.is_authenticated:
            from django.contrib.auth.models import User
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                # Fallback: get any user
                user = User.objects.first()
        
        validated_data['user'] = user
        
        # Set expiration date (30 days from now)
        from datetime import timedelta
        from django.utils import timezone
        validated_data['expires_at'] = timezone.now() + timedelta(days=30)
        
        return super().create(validated_data)

