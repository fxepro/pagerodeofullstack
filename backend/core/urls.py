"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from core.views import CustomTokenObtainPairView
import site_settings.urls
from core import views

# Import admin FIRST to ensure custom admin URLs are registered before admin.site.urls is used
# This must be imported before path('admin/', admin.site.urls) is defined
from core import admin as core_admin  # This will execute the admin.site.get_urls override

# Import rate limiting decorators
from core.rate_limiting import rate_limit_login, rate_limit_api

# Simple favicon handler to prevent 404s in logs
def favicon_view(request):
    return HttpResponse(status=204)  # No Content

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('users.urls')),
    path('', include('emails.urls')),
    path('', include('dns.urls')),
]

# Add site_settings URLs explicitly
print(f"DEBUG: Adding {len(site_settings.urls.urlpatterns)} URLs from site_settings")
for url in site_settings.urls.urlpatterns:
    print(f"  - {url.pattern}")
urlpatterns += site_settings.urls.urlpatterns
print(f"DEBUG: Total URLs now: {len(urlpatterns)}")

# Create rate-limited JWT views
# Apply rate limiting decorators to JWT token views
# Use CustomTokenObtainPairView which includes email_verified status
token_obtain_view = CustomTokenObtainPairView.as_view()
token_refresh_view = TokenRefreshView.as_view()

# Apply rate limiting decorators
RateLimitedTokenObtainPairView = rate_limit_login(token_obtain_view)
RateLimitedTokenRefreshView = rate_limit_api(token_refresh_view)

# API routes - specific routes first, then health check, then router
urlpatterns += [
    # Specific API routes (must come before catch-all /api/)
    path('api/token/', RateLimitedTokenObtainPairView, name='token_obtain_pair'),
    path('api/token/refresh/', RateLimitedTokenRefreshView, name='token_refresh'),
    # Monitoring and log viewing endpoints
    path('api/monitoring/logs/', views.log_files_list, name='log_files_list'),
    path('api/monitoring/logs/<str:log_type>/', views.view_logs, name='view_logs'),
    path('api/monitoring/status/', views.system_status, name='system_status'),
    # Health check endpoint at /api/ root (must come after specific routes but before router)
    # This handles /api/ requests when path is exactly /api/
    path('api/', views.health_check, name='api_health'),
    # Audit reports router (includes /api/reports/ via router.urls)
    # Note: When accessing /api/reports/, Django will skip the health_check pattern
    # because it requires an exact match for /api/, and will match this include instead
    path('api/', include('audit_reports.urls')),
    path('api/admin-tools/', include('api_monitoring.urls')),  # Admin API Monitoring
    # Analysis endpoints - each app has its own URLs
    path('', include('performance_analysis.urls')),
    path('', include('ssl_analysis.urls')),
    path('', include('dns_analysis.urls')),
    path('', include('sitemap_analysis.urls')),
    path('', include('api_analysis.urls')),
    path('', include('links_analysis.urls')),
    path('', include('typography_analysis.urls')),
    path('', include('monitor_analysis.urls')),
    path('', include('monitoring.urls')),  # Monitoring API endpoints
    path('favicon.ico', favicon_view, name='favicon'),  # Prevent 404s in logs
]
