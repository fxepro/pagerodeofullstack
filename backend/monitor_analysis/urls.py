"""
URL patterns for Monitor Analysis
"""

from django.urls import path
from . import views

urlpatterns = [
    path('api/analysis/monitor/', views.save_monitor_analysis, name='save_monitor_analysis'),
]

