from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditReportViewSet

router = DefaultRouter()
router.register(r'reports', AuditReportViewSet, basename='audit-report')

urlpatterns = [
    path('', include(router.urls)),
]

