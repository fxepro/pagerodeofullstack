"""
URL routing for collateral app
"""
from django.urls import path
from . import views

urlpatterns = [
    # Material endpoints
    path('materials/', views.list_materials, name='list_materials'),
    path('materials/<int:material_id>/', views.get_material, name='get_material'),
    path('materials/slug/<slug:slug>/', views.get_material_by_slug, name='get_material_by_slug'),
    path('materials/create/', views.create_material, name='create_material'),
    path('materials/<int:material_id>/update/', views.update_material, name='update_material'),
    path('materials/<int:material_id>/delete/', views.delete_material, name='delete_material'),
    path('materials/<int:material_id>/view/', views.increment_view_count, name='increment_view_count'),
    
    # Category endpoints
    path('categories/', views.list_categories, name='list_categories'),
    
    # Tag endpoints
    path('tags/', views.list_tags, name='list_tags'),
]

