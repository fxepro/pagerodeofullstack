"""
URL patterns for Typography Analysis
"""

from django.urls import path
from . import views

urlpatterns = [
    path('api/analysis/typography/', views.save_typography_analysis, name='save_typography_analysis'),
]

