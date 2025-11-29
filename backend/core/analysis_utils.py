"""
Shared utility functions for analysis endpoints
"""

from django.contrib.auth.models import User
from audit_reports.models import AuditReport


def get_user_from_request(request):
    """Get user from request, return None if not authenticated"""
    if request.user and request.user.is_authenticated:
        return request.user
    return None


def get_audit_report(audit_report_id):
    """Get audit report by ID, return None if not found or invalid"""
    if not audit_report_id:
        return None
    try:
        # Handle both string UUID and UUID object
        return AuditReport.objects.get(id=audit_report_id)
    except (AuditReport.DoesNotExist, ValueError, TypeError) as e:
        # ValueError: Invalid UUID format
        # TypeError: Wrong type
        # DoesNotExist: Record doesn't exist
        print(f"[GetAuditReport] Could not get audit report with ID {audit_report_id}: {e}")
        return None

