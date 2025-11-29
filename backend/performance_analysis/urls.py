"""
URL patterns for Performance Analysis
"""

from django.urls import path
from . import views

urlpatterns = [
    path('api/analysis/performance/', views.save_performance_analysis, name='save_performance_analysis'),
    path('api/analysis/performance/<int:analysis_id>/full-json/', views.get_full_lighthouse_json, name='get_full_lighthouse_json'),
    path('api/analysis/performance/urls/', views.get_unique_urls, name='get_unique_urls'),
    path('api/analysis/performance/history/', views.get_performance_history, name='get_performance_history'),
]

