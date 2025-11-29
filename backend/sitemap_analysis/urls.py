"""
URL patterns for Sitemap Analysis
"""

from django.urls import path
from . import views

urlpatterns = [
    path('api/analysis/sitemap/', views.save_sitemap_analysis, name='save_sitemap_analysis'),
]

