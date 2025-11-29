from rest_framework import serializers
from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    """Serializer for feedback list/detail views"""
    
    user = serializers.SerializerMethodField()
    
    class Meta:
        model = Feedback
        fields = [
            'id',
            'user_email',
            'user',
            'rating',
            'great_work',
            'could_be_better',
            'remove_and_relish',
            'status',
            'admin_notes',
            'ip_address',
            'created_at',
            'updated_at',
            'reviewed_at',
            'responded_at',
        ]
        read_only_fields = [
            'id',
            'ip_address',
            'created_at',
            'updated_at',
            'reviewed_at',
            'responded_at',
        ]
    
    def get_user(self, obj):
        """Return user_email or 'Anonymous' if not provided"""
        return obj.user_email or 'Anonymous'


class FeedbackCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new feedback"""
    
    class Meta:
        model = Feedback
        fields = [
            'user_email',
            'rating',
            'great_work',
            'could_be_better',
            'remove_and_relish',
        ]
    
    def validate_rating(self, value):
        """Validate rating is between 1 and 5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class FeedbackUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating feedback (admin only)"""
    
    class Meta:
        model = Feedback
        fields = [
            'status',
            'admin_notes',
        ]
    
    def update(self, instance, validated_data):
        """Update feedback and set timestamps based on status changes"""
        from django.utils import timezone
        
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        # Set reviewed_at when status changes to reviewed
        if old_status != 'reviewed' and new_status == 'reviewed':
            validated_data['reviewed_at'] = timezone.now()
        
        # Set responded_at when status changes to responded
        if old_status != 'responded' and new_status == 'responded':
            validated_data['responded_at'] = timezone.now()
        
        return super().update(instance, validated_data)

