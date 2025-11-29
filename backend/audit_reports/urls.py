from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditReportViewSet, get_audit_analyses

router = DefaultRouter()
router.register(r'reports', AuditReportViewSet, basename='auditreport')

urlpatterns = [
    path('', include(router.urls)),
    path('api/audit/<uuid:audit_report_id>/analyses/', get_audit_analyses, name='get_audit_analyses'),
]

