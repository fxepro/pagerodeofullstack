from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Tag, BlogPost, BlogAuthor


class AuthorSerializer(serializers.ModelSerializer):
    """Serializer for author information"""
    avatar_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'avatar_url']
        read_only_fields = ['id', 'username']
    
    def get_avatar_url(self, obj):
        """Get avatar URL from BlogAuthor profile if available"""
        try:
            if obj.blog_author_profile.avatar:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.blog_author_profile.avatar.url)
                return obj.blog_author_profile.avatar.url
        except BlogAuthor.DoesNotExist:
            pass
        return None
    
    def get_full_name(self, obj):
        """Get full name or username"""
        return obj.get_full_name() or obj.username


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for categories"""
    post_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'created_at', 'order', 'post_count']
        read_only_fields = ['id', 'created_at']
    
    def get_post_count(self, obj):
        """Get count of published posts in this category"""
        return obj.blogpost_set.filter(status='published').count()


class TagSerializer(serializers.ModelSerializer):
    """Serializer for tags"""
    post_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'created_at', 'post_count']
        read_only_fields = ['id', 'created_at']
    
    def get_post_count(self, obj):
        """Get count of published posts with this tag"""
        return obj.blogpost_set.filter(status='published').count()


class BlogPostListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    author = AuthorSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'featured_image_url',
            'author', 'category', 'tags', 'status', 'featured',
            'published_at', 'created_at', 'updated_at',
            'views_count', 'read_time', 'language'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'views_count']
    
    def get_featured_image_url(self, obj):
        """Get featured image URL"""
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None


class BlogPostSerializer(serializers.ModelSerializer):
    """Full serializer for detail views"""
    author = AuthorSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    featured_image_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content',
            'featured_image', 'featured_image_url', 'og_image', 'og_image_url',
            'author', 'category', 'category_id', 'tags', 'tag_ids',
            'status', 'featured', 'published_at', 'created_at', 'updated_at',
            'views_count', 'read_time',
            'meta_title', 'meta_description', 'meta_keywords',
            'language', 'translations'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at', 'views_count', 'read_time']
    
    def get_featured_image_url(self, obj):
        """Get featured image URL"""
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None
    
    def get_og_image_url(self, obj):
        """Get OG image URL"""
        if obj.og_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.og_image.url)
            return obj.og_image.url
        return None
    
    def create(self, validated_data):
        """Create blog post with category and tags"""
        tag_ids = validated_data.pop('tag_ids', [])
        category_id = validated_data.pop('category_id', None)
        
        # Set author from request user
        validated_data['author'] = self.context['request'].user
        
        # Set category if provided
        if category_id:
            try:
                validated_data['category'] = Category.objects.get(id=category_id)
            except Category.DoesNotExist:
                pass
        
        post = BlogPost.objects.create(**validated_data)
        
        # Set tags
        if tag_ids:
            tags = Tag.objects.filter(id__in=tag_ids)
            post.tags.set(tags)
        
        return post
    
    def update(self, instance, validated_data):
        """Update blog post with category and tags"""
        tag_ids = validated_data.pop('tag_ids', None)
        category_id = validated_data.pop('category_id', None)
        
        # Update category if provided
        if category_id is not None:
            if category_id:
                try:
                    instance.category = Category.objects.get(id=category_id)
                except Category.DoesNotExist:
                    instance.category = None
            else:
                instance.category = None
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Update tags if provided
        if tag_ids is not None:
            tags = Tag.objects.filter(id__in=tag_ids)
            instance.tags.set(tags)
        
        return instance


class BlogPostCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creation"""
    category_id = serializers.IntegerField(required=False, allow_null=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    
    class Meta:
        model = BlogPost
        fields = [
            'title', 'slug', 'excerpt', 'content', 'featured_image',
            'category_id', 'tag_ids', 'status', 'featured',
            'meta_title', 'meta_description', 'meta_keywords', 'og_image',
            'language', 'translations'
        ]
    
    def create(self, validated_data):
        """Create blog post"""
        tag_ids = validated_data.pop('tag_ids', [])
        category_id = validated_data.pop('category_id', None)
        
        validated_data['author'] = self.context['request'].user
        
        if category_id:
            try:
                validated_data['category'] = Category.objects.get(id=category_id)
            except Category.DoesNotExist:
                pass
        
        post = BlogPost.objects.create(**validated_data)
        
        if tag_ids:
            tags = Tag.objects.filter(id__in=tag_ids)
            post.tags.set(tags)
        
        return post

