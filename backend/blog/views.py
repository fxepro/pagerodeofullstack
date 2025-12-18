"""
Blog API Views
Handles CRUD operations for blog posts, categories, and tags
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.utils import timezone
from users.permission_classes import HasFeaturePermission
from users.permission_utils import has_permission

from .models import BlogPost, Category, Tag
from .serializers import (
    BlogPostSerializer, BlogPostListSerializer, BlogPostCreateSerializer,
    CategorySerializer, TagSerializer, AuthorSerializer
)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_posts(request):
    """
    List blog posts with filters.
    
    Query params:
        status: Filter by status (draft, published, archived)
        category: Filter by category slug
        tag: Filter by tag slug
        search: Search in title and content
        language: Filter by language code
        featured: Filter featured posts (true/false)
        ordering: Order by field (-published_at, -created_at, -views_count)
        page: Page number
        page_size: Items per page
    """
    queryset = BlogPost.objects.all()
    
    # Permission-based filtering
    # Public users and users without blog.view permission can only see published posts
    user = request.user
    if not user.is_authenticated or not has_permission(user, 'blog.view'):
        queryset = queryset.filter(status='published')
    
    # Apply filters
    status_filter = request.GET.get('status')
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    category_slug = request.GET.get('category')
    if category_slug:
        queryset = queryset.filter(category__slug=category_slug)
    
    tag_slug = request.GET.get('tag')
    if tag_slug:
        queryset = queryset.filter(tags__slug=tag_slug)
    
    search = request.GET.get('search')
    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(excerpt__icontains=search) |
            Q(content__icontains=search)
        )
    
    language = request.GET.get('language')
    if language:
        queryset = queryset.filter(language=language)
    
    featured = request.GET.get('featured')
    if featured == 'true':
        queryset = queryset.filter(featured=True)
    elif featured == 'false':
        queryset = queryset.filter(featured=False)
    
    # Ordering
    ordering = request.GET.get('ordering', '-published_at')
    if ordering:
        queryset = queryset.order_by(ordering)
    
    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 10))
    start = (page - 1) * page_size
    end = start + page_size
    
    total = queryset.count()
    posts = queryset[start:end]
    
    serializer = BlogPostListSerializer(posts, many=True, context={'request': request})
    
    return Response({
        'results': serializer.data,
        'count': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_post(request, post_id):
    """Get blog post by ID"""
    try:
        post = BlogPost.objects.get(id=post_id)
    except BlogPost.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Permission check: non-authenticated or users without blog.view can only see published posts
    user = request.user
    if not user.is_authenticated or not has_permission(user, 'blog.view'):
        if post.status != 'published':
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = BlogPostSerializer(post, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_post_by_slug(request, slug):
    """Get blog post by slug"""
    try:
        post = BlogPost.objects.get(slug=slug)
    except BlogPost.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Permission check
    user = request.user
    if not user.is_authenticated or not has_permission(user, 'blog.view'):
        if post.status != 'published':
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = BlogPostSerializer(post, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('blog.create')])
def create_post(request):
    """Create a new blog post"""
    serializer = BlogPostCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        post = serializer.save()
        response_serializer = BlogPostSerializer(post, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated, HasFeaturePermission('blog.edit')])
def update_post(request, post_id):
    """Update an existing blog post"""
    try:
        post = BlogPost.objects.get(id=post_id)
    except BlogPost.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user owns the post or has admin permissions
    if post.author != request.user and not has_permission(request.user, 'blog.edit'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = BlogPostSerializer(post, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, HasFeaturePermission('blog.delete')])
def delete_post(request, post_id):
    """Delete a blog post"""
    try:
        post = BlogPost.objects.get(id=post_id)
    except BlogPost.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user owns the post or has admin permissions
    if post.author != request.user and not has_permission(request.user, 'blog.delete'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    post.delete()
    return Response({'message': 'Post deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([AllowAny])
def featured_posts(request):
    """Get featured posts"""
    queryset = BlogPost.objects.filter(featured=True, status='published')
    queryset = queryset.order_by('-published_at')[:10]  # Limit to 10
    
    serializer = BlogPostListSerializer(queryset, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def recent_posts(request):
    """Get recent posts (excludes featured)"""
    limit = int(request.GET.get('limit', 10))
    queryset = BlogPost.objects.filter(status='published', featured=False)
    queryset = queryset.order_by('-published_at')[:limit]
    
    serializer = BlogPostListSerializer(queryset, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def increment_view_count(request, post_id):
    """Increment view count for a post"""
    try:
        post = BlogPost.objects.get(id=post_id)
        post.views_count += 1
        post.save(update_fields=['views_count'])
        return Response({'views_count': post.views_count})
    except BlogPost.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_categories(request):
    """List all categories"""
    categories = Category.objects.annotate(
        post_count=Count('blogpost', filter=Q(blogpost__status='published'))
    ).order_by('order', 'name')
    
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('blog.create')])
def create_category(request):
    """Create a new category"""
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_tags(request):
    """List all tags"""
    tags = Tag.objects.annotate(
        post_count=Count('blogpost', filter=Q(blogpost__status='published'))
    ).order_by('name')
    
    serializer = TagSerializer(tags, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('blog.create')])
def create_tag(request):
    """Create a new tag"""
    serializer = TagSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
