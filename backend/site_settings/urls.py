from django.urls import path
from . import views

urlpatterns = [
    # Theme Palette Endpoints
    path('api/palettes/', views.list_palettes, name='list_palettes'),
    path('api/palettes/active/', views.get_active_palette, name='get_active_palette'),
    path('api/palettes/stats/', views.get_palette_stats, name='get_palette_stats'),
    path('api/palettes/<int:palette_id>/', views.get_palette, name='get_palette'),
    path('api/palettes/create/', views.create_palette, name='create_palette'),
    path('api/palettes/<int:palette_id>/update/', views.update_palette, name='update_palette'),
    path('api/palettes/<int:palette_id>/activate/', views.activate_palette, name='activate_palette'),
    path('api/palettes/<int:palette_id>/delete/', views.delete_palette, name='delete_palette'),
    
    # Typography Preset Endpoints
    path('api/typography/', views.list_typography_presets, name='list_typography_presets'),
    path('api/typography/active/', views.get_active_typography, name='get_active_typography'),
    path('api/typography/<int:preset_id>/', views.get_typography_preset, name='get_typography_preset'),
    path('api/typography/create/', views.create_typography_preset, name='create_typography_preset'),
    path('api/typography/<int:preset_id>/update/', views.update_typography_preset, name='update_typography_preset'),
    path('api/typography/<int:preset_id>/activate/', views.activate_typography_preset, name='activate_typography_preset'),
    path('api/typography/<int:preset_id>/delete/', views.delete_typography_preset, name='delete_typography_preset'),
    
    # Site Config Endpoints
    path('api/site-config/', views.get_site_config, name='get_site_config'),
    path('api/site-config/update/', views.update_site_config, name='update_site_config'),
    path('api/site-config/public/', views.get_public_site_flags, name='get_public_site_flags'),
]

