"""
URL patterns for Admin API Monitoring
"""

from django.urls import path
from . import views

urlpatterns = [
    path('endpoints/', views.api_endpoints_list, name='api-endpoints-list'),
    path('endpoints/<int:pk>/', views.api_endpoint_detail, name='api-endpoint-detail'),
    path('endpoints/<int:pk>/test/', views.test_endpoint, name='test-endpoint'),
    path('endpoints/test-multiple/', views.test_multiple_endpoints, name='test-multiple-endpoints'),
    path('endpoints/discover/', views.discover_apis, name='discover-apis'),
    path('checks/', views.api_checks_list, name='api-checks-list'),
    path('alerts/', views.api_alerts_list, name='api-alerts-list'),
    path('alerts/<int:pk>/resolve/', views.resolve_alert, name='resolve-alert'),
    path('stats/', views.api_monitoring_stats, name='api-monitoring-stats'),
]

