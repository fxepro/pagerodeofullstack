"""
URL patterns for DNS Analysis
"""

from django.urls import path
from . import views

urlpatterns = [
    path('api/analysis/dns/', views.save_dns_analysis, name='save_dns_analysis'),
]

