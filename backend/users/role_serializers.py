from rest_framework import serializers
from django.contrib.auth.models import Permission as DjangoPermission, Group
from .role_models import Role
from .models import UserProfile

class PermissionSerializer(serializers.ModelSerializer):
    content_type = serializers.SerializerMethodField()
    
    class Meta:
        model = DjangoPermission
        fields = ['id', 'name', 'content_type', 'codename']
    
    def get_content_type(self, obj):
        return {
            'app_label': obj.content_type.app_label,
            'model': obj.content_type.model
        }

class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    user_count = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    is_system_role = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'permissions', 'is_system_role', 'user_count']
        read_only_fields = ['id']
    
    def get_user_count(self, obj):
        return UserProfile.objects.filter(role=obj.name).count()
    
    def get_description(self, obj):
        # Use group name as description for now
        return f"Role: {obj.name.title()}"
    
    def get_is_system_role(self, obj):
        # Consider admin and viewer as system roles
        return obj.name in ['admin', 'viewer']

class RoleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['name']
    
    def validate_name(self, value):
        if Group.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("A role with this name already exists.")
        return value

class RoleUpdateSerializer(serializers.ModelSerializer):
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Group
        fields = ['name', 'permission_ids']
    
    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permission_ids', None)
        
        # Update role name
        instance.name = validated_data.get('name', instance.name)
        instance.save()
        
        # Update permissions if provided
        if permission_ids is not None:
            permissions = DjangoPermission.objects.filter(id__in=permission_ids)
            instance.permissions.set(permissions)
        
        return instance
