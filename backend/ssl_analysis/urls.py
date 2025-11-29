"""
URL patterns for SSL Analysis
"""

from django.urls import path
from . import views

urlpatterns = [
    path('api/analysis/ssl/', views.save_ssl_analysis, name='save_ssl_analysis'),
]

