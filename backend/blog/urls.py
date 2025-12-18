from django.urls import path
from . import views

urlpatterns = [
    # Post endpoints
    path('posts/', views.list_posts, name='list_posts'),
    path('posts/<int:post_id>/', views.get_post, name='get_post'),
    path('posts/slug/<slug:slug>/', views.get_post_by_slug, name='get_post_by_slug'),
    path('posts/create/', views.create_post, name='create_post'),
    path('posts/<int:post_id>/update/', views.update_post, name='update_post'),
    path('posts/<int:post_id>/delete/', views.delete_post, name='delete_post'),
    path('posts/featured/', views.featured_posts, name='featured_posts'),
    path('posts/recent/', views.recent_posts, name='recent_posts'),
    path('posts/<int:post_id>/view/', views.increment_view_count, name='increment_view_count'),
    
    # Category endpoints
    path('categories/', views.list_categories, name='list_categories'),
    path('categories/create/', views.create_category, name='create_category'),
    
    # Tag endpoints
    path('tags/', views.list_tags, name='list_tags'),
    path('tags/create/', views.create_tag, name='create_tag'),
]

