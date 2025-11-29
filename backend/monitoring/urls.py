"""
URL patterns for monitoring API endpoints.
"""

from django.urls import path
from . import views

urlpatterns = [
    # Site monitoring endpoints
    path('api/monitor/sites/<int:site_id>/history/', views.site_history, name='site_history'),
    path('api/monitor/sites/<int:site_id>/uptime/', views.site_uptime, name='site_uptime'),
    path('api/monitor/sites/<int:site_id>/incidents/', views.site_incidents, name='site_incidents'),
    path('api/monitor/sites/<int:site_id>/stats/', views.site_stats, name='site_stats'),
    
    # Page monitoring endpoints
    path('api/monitor/pages/<int:link_id>/history/', views.page_history, name='page_history'),
    path('api/monitor/pages/<int:link_id>/stats/', views.page_stats, name='page_stats'),
]

