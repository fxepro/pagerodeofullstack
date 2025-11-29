"""
URL patterns for Links Analysis
"""

from django.urls import path
from . import views

urlpatterns = [
    path('api/analysis/links/', views.save_links_analysis, name='save_links_analysis'),
]

