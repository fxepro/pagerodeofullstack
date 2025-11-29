"""
URL patterns for API Analysis
"""

from django.urls import path
from . import views

urlpatterns = [
    path('api/analysis/api/', views.save_api_analysis, name='save_api_analysis'),
]

