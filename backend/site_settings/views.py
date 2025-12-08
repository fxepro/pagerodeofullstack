from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from users.permission_utils import has_permission
from .models import ThemePalette, TypographyPreset, SiteConfig
from .serializers import (
    ThemePaletteSerializer,
    ThemePaletteCreateSerializer,
    ThemePaletteUpdateSerializer,
    TypographyPresetSerializer,
    TypographyPresetCreateSerializer,
    TypographyPresetUpdateSerializer,
    SiteConfigSerializer
)
# Import monitoring utilities
from core.monitoring import theme_monitor


# ==================== THEME PALETTE ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_palettes(request):
    """List all theme palettes (Requires themes.view permission)"""
    # Check permission
    if not has_permission(request.user, 'themes.view'):
        return Response(
            {'error': 'You do not have permission to view themes.'},
            status=status.HTTP_403_FORBIDDEN
        )
    try:
        palettes = ThemePalette.objects.all()
        serializer = ThemePaletteSerializer(palettes, many=True)
        return Response(serializer.data)
    except Exception as e:
        # Return empty array if table doesn't exist yet
        return Response([])


@api_view(['GET'])
@permission_classes([AllowAny])
def get_active_palette(request):
    """Get the currently active palette (Public endpoint)"""
    try:
        palette = ThemePalette.objects.get(is_active=True)
        serializer = ThemePaletteSerializer(palette)
        # Log successful theme load
        theme_monitor.log_theme_load(str(palette.id), success=True)
        return Response(serializer.data)
    except ThemePalette.DoesNotExist:
        # Return default palette if none exists
        default_palette = {
            'id': 0,
            'name': 'Default Purple',
            'description': 'Default system palette',
            'primary_color': '#9333ea',
            'secondary_color': '#7c3aed',
            'accent_1': '#a855f7',
            'accent_2': '#c084fc',
            'accent_3': '#e9d5ff',
            'is_active': True,
            'is_system': True,
            'created_by_username': 'system',
            'created_at': None,
        }
        # Log successful theme load (default)
        theme_monitor.log_theme_load('default', success=True)
        return Response(default_palette)
    except Exception as e:
        # Log theme load failure
        theme_monitor.log_theme_load('unknown', success=False, error=str(e))
        # Return default palette on error
        default_palette = {
            'id': 0,
            'name': 'Default Purple',
            'description': 'Default system palette',
            'primary_color': '#9333ea',
            'secondary_color': '#7c3aed',
            'accent_1': '#a855f7',
            'accent_2': '#c084fc',
            'accent_3': '#e9d5ff',
            'is_active': True,
            'is_system': True,
            'created_by_username': 'system',
            'created_at': None,
        }
        return Response(default_palette)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_palette(request, palette_id):
    """Get a specific palette by ID (Admin only)"""
    palette = get_object_or_404(ThemePalette, id=palette_id)
    serializer = ThemePaletteSerializer(palette)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_palette(request):
    """Create a new theme palette (Admin only)"""
    serializer = ThemePaletteCreateSerializer(data=request.data)
    if serializer.is_valid():
        palette = serializer.save(created_by=request.user)
        response_serializer = ThemePaletteSerializer(palette)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAdminUser])
def update_palette(request, palette_id):
    """Update a theme palette (Admin only)"""
    palette = get_object_or_404(ThemePalette, id=palette_id)
    
    # Prevent modification of system palettes
    if palette.is_system:
        return Response(
            {'error': 'System palettes cannot be modified'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = ThemePaletteUpdateSerializer(
        palette,
        data=request.data,
        partial=(request.method == 'PATCH')
    )
    if serializer.is_valid():
        serializer.save()
        response_serializer = ThemePaletteSerializer(palette)
        return Response(response_serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def activate_palette(request, palette_id):
    """Activate a theme palette (Admin only)"""
    try:
        palette = get_object_or_404(ThemePalette, id=palette_id)
        
        # Deactivate all palettes
        ThemePalette.objects.all().update(is_active=False)
        
        # Activate the selected palette
        palette.is_active = True
        palette.save()
        
        # Also update the SiteConfig to point to this palette
        config = SiteConfig.get_config()
        config.active_palette = palette
        config.updated_by = request.user
        config.save()
        
        # Log successful palette activation
        theme_monitor.log_palette_activation(str(palette.id), success=True)
        
        serializer = ThemePaletteSerializer(palette)
        return Response(serializer.data)
    except Exception as e:
        # Log palette activation failure
        theme_monitor.log_palette_activation(str(palette_id), success=False, error=str(e))
        return Response(
            {'error': f'Failed to activate palette: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_palette(request, palette_id):
    """Delete a theme palette (Admin only)"""
    palette = get_object_or_404(ThemePalette, id=palette_id)
    
    # Prevent deletion of system palettes
    if palette.is_system:
        return Response(
            {'error': 'System palettes cannot be deleted'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Prevent deletion of active palette
    if palette.is_active:
        return Response(
            {'error': 'Cannot delete the active palette. Please activate another palette first.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    palette.delete()
    return Response(
        {'message': 'Palette deleted successfully'},
        status=status.HTTP_204_NO_CONTENT
    )


# ==================== SITE CONFIG ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_site_config(request):
    """Get site configuration (Authenticated users)"""
    config = SiteConfig.get_config()
    serializer = SiteConfigSerializer(config)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_public_site_flags(request):
    """Public endpoint for client runtime flags (no secrets)"""
    config = SiteConfig.get_config()
    return Response({
        'enable_analytics': getattr(config, 'enable_analytics', False),
    })


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAdminUser])
def update_site_config(request):
    """Update site configuration (Admin only)"""
    import logging
    logger = logging.getLogger(__name__)
    
    config = SiteConfig.get_config()
    
    # Log incoming data for debugging
    logger.info(f"Updating site config. Received data: {request.data}")
    logger.info(f"Current enable_email_verification: {config.enable_email_verification}")
    
    serializer = SiteConfigSerializer(
        config,
        data=request.data,
        partial=(request.method == 'PATCH')
    )
    
    if serializer.is_valid():
        # Log what will be saved
        logger.info(f"Serializer valid. Saving with data: {serializer.validated_data}")
        serializer.save(updated_by=request.user)
        
        # Refresh and verify save
        config.refresh_from_db()
        logger.info(f"After save - enable_email_verification: {config.enable_email_verification}")
        
        return Response(serializer.data)
    
    # Log validation errors
    logger.error(f"Serializer validation failed: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_palette_stats(request):
    """Get statistics about theme palettes"""
    total_palettes = ThemePalette.objects.count()
    active_palette = ThemePalette.objects.filter(is_active=True).first()
    system_palettes = ThemePalette.objects.filter(is_system=True).count()
    custom_palettes = total_palettes - system_palettes
    
    return Response({
        'total_palettes': total_palettes,
        'active_palette': ThemePaletteSerializer(active_palette).data if active_palette else None,
        'system_palettes': system_palettes,
        'custom_palettes': custom_palettes,
    })


# ==================== TYPOGRAPHY PRESET ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_typography_presets(request):
    """List all typography presets (Admin only)"""
    try:
        presets = TypographyPreset.objects.all()
        serializer = TypographyPresetSerializer(presets, many=True)
        return Response(serializer.data)
    except Exception as e:
        # Return empty array if table doesn't exist yet
        return Response([])


@api_view(['GET'])
@permission_classes([AllowAny])
def get_active_typography(request):
    """Get the currently active typography preset (Public endpoint)"""
    try:
        preset = TypographyPreset.objects.get(is_active=True)
        serializer = TypographyPresetSerializer(preset)
        return Response(serializer.data)
    except TypographyPreset.DoesNotExist:
        # Return default typography if none exists
        default_preset = {
            'id': 0,
            'name': 'Default',
            'description': 'Default system typography',
            'body_font': 'Inter, system-ui, -apple-system, sans-serif',
            'heading_font': 'Inter, system-ui, -apple-system, sans-serif',
            'font_size_base': '16px',
            'font_size_h1': '48px',
            'font_size_h2': '36px',
            'font_size_h3': '30px',
            'font_size_h4': '24px',
            'font_size_h5': '20px',
            'font_size_h6': '18px',
            'line_height_base': '1.6',
            'is_active': True,
            'is_system': True,
            'created_by_username': 'system',
            'created_at': None,
        }
        return Response(default_preset)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_typography_preset(request, preset_id):
    """Get a specific typography preset by ID (Admin only)"""
    preset = get_object_or_404(TypographyPreset, id=preset_id)
    serializer = TypographyPresetSerializer(preset)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_typography_preset(request):
    """Create a new typography preset (Admin only)"""
    serializer = TypographyPresetCreateSerializer(data=request.data)
    if serializer.is_valid():
        preset = serializer.save(created_by=request.user)
        response_serializer = TypographyPresetSerializer(preset)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAdminUser])
def update_typography_preset(request, preset_id):
    """Update a typography preset (Admin only)"""
    preset = get_object_or_404(TypographyPreset, id=preset_id)
    
    # Prevent modification of system presets
    if preset.is_system:
        return Response(
            {'error': 'System typography presets cannot be modified'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = TypographyPresetUpdateSerializer(
        preset,
        data=request.data,
        partial=(request.method == 'PATCH')
    )
    if serializer.is_valid():
        serializer.save()
        response_serializer = TypographyPresetSerializer(preset)
        return Response(response_serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def activate_typography_preset(request, preset_id):
    """Activate a typography preset (Admin only)"""
    preset = get_object_or_404(TypographyPreset, id=preset_id)
    
    # Deactivate all presets
    TypographyPreset.objects.all().update(is_active=False)
    
    # Activate the selected preset
    preset.is_active = True
    preset.save()
    
    # Also update the SiteConfig to point to this preset
    config = SiteConfig.get_config()
    config.active_typography = preset
    config.updated_by = request.user
    config.save()
    
    serializer = TypographyPresetSerializer(preset)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_typography_preset(request, preset_id):
    """Delete a typography preset (Admin only)"""
    preset = get_object_or_404(TypographyPreset, id=preset_id)
    
    # Prevent deletion of system presets
    if preset.is_system:
        return Response(
            {'error': 'System typography presets cannot be deleted'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Prevent deletion of active preset
    if preset.is_active:
        return Response(
            {'error': 'Cannot delete the active preset. Please activate another preset first.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    preset.delete()
    return Response(
        {'message': 'Typography preset deleted successfully'},
        status=status.HTTP_204_NO_CONTENT
    )

