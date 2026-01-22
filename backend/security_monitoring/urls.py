"""
URLs for Security Monitoring
"""

from django.urls import path
from . import views, views_audit

urlpatterns = [
    path('scans/', views.scans_list, name='scans_list'),
    path('scans/<int:pk>/', views.scan_detail, name='scan_detail'),
    path('scans/<int:pk>/run/', views.run_scan, name='run_scan'),
    path('findings/', views.findings_list, name='findings_list'),
    path('findings/<int:pk>/', views.finding_detail, name='finding_detail'),
    path('stats/', views.security_stats, name='security_stats'),
    path('schedules/', views.schedules_list, name='schedules_list'),
    path('tools/', views.tools_list, name='tools_list'),
    path('tools/<int:pk>/', views.tool_detail, name='tool_detail'),
    # Security Audit endpoints
    path('audit/', views_audit.create_audit, name='create_audit'),
    path('audit/list/', views_audit.audit_list, name='audit_list'),
    path('audit/<int:pk>/', views_audit.audit_detail, name='audit_detail'),
]

