"""
API Views for Collateral (Learning Materials)
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from users.permission_classes import HasFeaturePermission
from users.permission_utils import has_permission

from .models import LearningMaterial, CollateralCategory, CollateralTag
from .serializers import (
    LearningMaterialSerializer, LearningMaterialListSerializer, LearningMaterialCreateSerializer,
    CollateralCategorySerializer, CollateralTagSerializer
)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_materials(request):
    """
    List learning materials with filters.
    
    Query params:
        status: Filter by status (draft, published, archived)
        category: Filter by category slug
        tag: Filter by tag slug
        content_type: Filter by content type (documentation, tutorial, video, etc.)
        related_feature: Filter by related feature slug
        search: Search in title and content
        language: Filter by language code
        featured: Filter featured materials (true/false)
        ordering: Order by field (-published_at, -created_at, -views_count)
        page: Page number
        page_size: Items per page
    """
    queryset = LearningMaterial.objects.all()
    
    # Permission-based filtering
    user = request.user
    if not user.is_authenticated or not has_permission(user, 'collateral.view'):
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
    
    content_type = request.GET.get('content_type')
    if content_type:
        queryset = queryset.filter(content_type=content_type)
    
    related_feature = request.GET.get('related_feature')
    if related_feature:
        queryset = queryset.filter(related_feature=related_feature)
    
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
    materials = queryset[start:end]
    
    serializer = LearningMaterialListSerializer(materials, many=True, context={'request': request})
    
    return Response({
        'results': serializer.data,
        'count': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_material(request, material_id):
    """Get learning material by ID"""
    try:
        material = LearningMaterial.objects.get(id=material_id)
    except LearningMaterial.DoesNotExist:
        return Response({'error': 'Material not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Permission check
    user = request.user
    if not user.is_authenticated or not has_permission(user, 'collateral.view'):
        if material.status != 'published':
            return Response({'error': 'Material not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = LearningMaterialSerializer(material, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_material_by_slug(request, slug):
    """Get learning material by slug"""
    try:
        material = LearningMaterial.objects.get(slug=slug)
    except LearningMaterial.DoesNotExist:
        return Response({'error': 'Material not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Permission check
    user = request.user
    if not user.is_authenticated or not has_permission(user, 'collateral.view'):
        if material.status != 'published':
            return Response({'error': 'Material not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = LearningMaterialSerializer(material, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('collateral.create')])
def create_material(request):
    """Create a new learning material"""
    try:
        # Handle FormData - convert tag_ids array format
        data = request.data.copy()
        
        # Convert QueryDict to regular dict if needed
        if hasattr(data, 'dict'):
            data = data.dict()
        
        # Handle tag_ids array from FormData
        tag_ids = []
        index = 0
        while f'tag_ids[{index}]' in data:
            try:
                tag_ids.append(int(data.pop(f'tag_ids[{index}]')))
            except (ValueError, KeyError):
                break
            index += 1
        
        if tag_ids:
            data['tag_ids'] = tag_ids
        
        # Handle empty tag_ids array
        if 'tag_ids' not in data:
            data['tag_ids'] = []
        
        serializer = LearningMaterialCreateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            material = serializer.save()
            response_serializer = LearningMaterialSerializer(material, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error creating material: {str(e)}")
        print(error_trace)
        return Response({
            'error': str(e),
            'detail': 'An error occurred while creating the learning material'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated, HasFeaturePermission('collateral.edit')])
def update_material(request, material_id):
    """Update an existing learning material"""
    try:
        material = LearningMaterial.objects.get(id=material_id)
    except LearningMaterial.DoesNotExist:
        return Response({'error': 'Material not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user owns the material or has admin permissions
    if material.author != request.user and not has_permission(request.user, 'collateral.edit'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Handle FormData - convert tag_ids array format
        data = request.data.copy()
        
        # Convert QueryDict to regular dict if needed
        if hasattr(data, 'dict'):
            data = data.dict()
        
        # Handle tag_ids array from FormData
        tag_ids = []
        index = 0
        while f'tag_ids[{index}]' in data:
            try:
                tag_ids.append(int(data.pop(f'tag_ids[{index}]')))
            except (ValueError, KeyError):
                break
            index += 1
        
        if tag_ids:
            data['tag_ids'] = tag_ids
        
        serializer = LearningMaterialCreateSerializer(material, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            response_serializer = LearningMaterialSerializer(material, context={'request': request})
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error updating material: {str(e)}")
        print(error_trace)
        return Response({
            'error': str(e),
            'detail': 'An error occurred while updating the learning material'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, HasFeaturePermission('collateral.delete')])
def delete_material(request, material_id):
    """Delete a learning material"""
    try:
        material = LearningMaterial.objects.get(id=material_id)
    except LearningMaterial.DoesNotExist:
        return Response({'error': 'Material not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user owns the material or has admin permissions
    if material.author != request.user and not has_permission(request.user, 'collateral.delete'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    material.delete()
    return Response({'message': 'Material deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_categories(request):
    """List all collateral categories"""
    categories = CollateralCategory.objects.annotate(
        material_count=Count('learningmaterial', filter=Q(learningmaterial__status='published'))
    ).order_by('order', 'name')
    
    serializer = CollateralCategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_tags(request):
    """List all collateral tags"""
    tags = CollateralTag.objects.annotate(
        material_count=Count('learningmaterial', filter=Q(learningmaterial__status='published'))
    ).order_by('name')
    
    serializer = CollateralTagSerializer(tags, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def increment_view_count(request, material_id):
    """Increment view count for a material"""
    try:
        material = LearningMaterial.objects.get(id=material_id)
        material.views_count += 1
        material.save(update_fields=['views_count'])
        return Response({'views_count': material.views_count})
    except LearningMaterial.DoesNotExist:
        return Response({'error': 'Material not found'}, status=status.HTTP_404_NOT_FOUND)

