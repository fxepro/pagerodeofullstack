"""
DRF Serializers for Collateral (Learning Materials)
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import CollateralCategory, CollateralTag, LearningMaterial, LearningMaterialAuthor


class AuthorSerializer(serializers.ModelSerializer):
    """Serializer for User (author)"""
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'avatar_url']
        read_only_fields = ['id', 'username', 'email']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username
    
    def get_avatar_url(self, obj):
        # If user has a collateral author profile with avatar, return it
        if hasattr(obj, 'collateral_author_profile') and obj.collateral_author_profile.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.collateral_author_profile.avatar.url)
        return None


class CollateralCategorySerializer(serializers.ModelSerializer):
    """Serializer for CollateralCategory"""
    post_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CollateralCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'created_at', 'order', 'post_count']
        read_only_fields = ['id', 'created_at', 'post_count']
    
    def get_post_count(self, obj):
        return obj.learningmaterial_set.filter(status='published').count()


class CollateralTagSerializer(serializers.ModelSerializer):
    """Serializer for CollateralTag"""
    post_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CollateralTag
        fields = ['id', 'name', 'slug', 'description', 'created_at', 'post_count']
        read_only_fields = ['id', 'created_at', 'post_count']
    
    def get_post_count(self, obj):
        return obj.learningmaterial_set.filter(status='published').count()


class LearningMaterialListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing learning materials"""
    author = AuthorSerializer(read_only=True)
    category = CollateralCategorySerializer(read_only=True)
    tags = CollateralTagSerializer(many=True, read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = LearningMaterial
        fields = [
            'id', 'title', 'slug', 'excerpt', 'featured_image', 'featured_image_url',
            'video_url', 'author', 'category', 'tags', 'content_type', 'status',
            'featured', 'published_at', 'created_at', 'updated_at', 'views_count',
            'read_time', 'related_feature', 'related_feature_url'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'views_count', 'read_time']
    
    def get_featured_image_url(self, obj):
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
        return None


class LearningMaterialSerializer(serializers.ModelSerializer):
    """Full serializer for learning material details"""
    author = AuthorSerializer(read_only=True)
    category = CollateralCategorySerializer(read_only=True)
    tags = CollateralTagSerializer(many=True, read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = LearningMaterial
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 'featured_image', 'featured_image_url',
            'video_url', 'author', 'category', 'tags', 'content_type', 'status',
            'featured', 'published_at', 'created_at', 'updated_at', 'views_count',
            'read_time', 'meta_title', 'meta_description', 'meta_keywords', 'og_image',
            'og_image_url', 'language', 'translations', 'related_feature', 'related_feature_url'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'views_count', 'read_time']
    
    def get_featured_image_url(self, obj):
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
        return None
    
    def get_og_image_url(self, obj):
        if obj.og_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.og_image.url)
        return None


class LearningMaterialCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating learning materials"""
    category_id = serializers.IntegerField(required=False, allow_null=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = LearningMaterial
        fields = [
            'title', 'slug', 'excerpt', 'content', 'featured_image', 'video_url',
            'category_id', 'tag_ids', 'content_type', 'status', 'featured',
            'published_at', 'meta_title', 'meta_description', 'meta_keywords',
            'og_image', 'language', 'translations', 'related_feature', 'related_feature_url'
        ]
    
    def create(self, validated_data):
        category_id = validated_data.pop('category_id', None)
        tag_ids = validated_data.pop('tag_ids', [])
        
        # Set author from request user
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['author'] = request.user
        else:
            raise serializers.ValidationError({'author': 'User must be authenticated'})
        
        # Auto-generate slug if not provided
        if not validated_data.get('slug') and validated_data.get('title'):
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['title'])
        
        # Set category if provided
        if category_id:
            from .models import CollateralCategory
            try:
                validated_data['category'] = CollateralCategory.objects.get(id=category_id)
            except CollateralCategory.DoesNotExist:
                pass
        
        # Create the material
        try:
            material = LearningMaterial.objects.create(**validated_data)
        except Exception as e:
            raise serializers.ValidationError({'error': f'Failed to create material: {str(e)}'})
        
        # Add tags
        if tag_ids:
            from .models import CollateralTag
            tags = CollateralTag.objects.filter(id__in=tag_ids)
            material.tags.set(tags)
        
        return material
    
    def update(self, instance, validated_data):
        category_id = validated_data.pop('category_id', None)
        tag_ids = validated_data.pop('tag_ids', None)
        
        # Update category if provided
        if category_id is not None:
            from .models import CollateralCategory
            if category_id:
                try:
                    instance.category = CollateralCategory.objects.get(id=category_id)
                except CollateralCategory.DoesNotExist:
                    instance.category = None
            else:
                instance.category = None
        
        # Update tags if provided
        if tag_ids is not None:
            from .models import CollateralTag
            tags = CollateralTag.objects.filter(id__in=tag_ids)
            instance.tags.set(tags)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

