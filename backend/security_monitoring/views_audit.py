"""
API views for Security Audit orchestration
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction
from users.permission_classes import HasFeaturePermission
from .models import SecurityAudit, SecurityScan, SecurityFinding
from .serializers import (
    SecurityAuditSerializer,
    SecurityAuditCreateSerializer,
    SecurityScanSerializer,
    SecurityFindingSerializer
)
from .utils import execute_security_scan
from django.conf import settings
import logging
import threading

logger = logging.getLogger(__name__)

# Scan type to consumer-friendly category mapping
SCAN_CATEGORY_MAP = {
    'dns_discovery': 'attack_surface',
    'port_scan': 'network_analysis',
    'vulnerability_scan': 'vulnerability_assessment',
    'dast': 'vulnerability_assessment',
    'misconfiguration_scan': 'configuration_analysis',
    'ssl_check': 'configuration_analysis',
    'headers_check': 'configuration_analysis',
    'sql_injection': 'exploit_testing',
    'cms_scan': 'vulnerability_assessment',
    'continuous_monitoring': 'network_analysis',
    'manual_pentest': 'exploit_testing',
}

# Default scan sequence (quick scans first, then longer ones)
DEFAULT_SCAN_SEQUENCE = [
    'headers_check',      # Quick - HTTP headers
    'ssl_check',         # Quick - SSL/TLS
    'dns_discovery',     # Medium - DNS/subdomain
    'port_scan',         # Medium - Port scanning
    'misconfiguration_scan',  # Medium - Server config
    'dast',              # Long - Web app scanning
    'vulnerability_scan', # Long - Network vulnerabilities
    'sql_injection',     # Medium - SQL injection
    'cms_scan',          # Medium - CMS-specific
]


def orchestrate_audit_scans(audit_id):
    """
    Background function to orchestrate and execute all scans for an audit
    """
    try:
        audit = SecurityAudit.objects.get(id=audit_id)
        audit.status = 'running'
        audit.started_at = timezone.now()
        audit.save()
        
        logger.info(f"[SecurityAudit] Starting orchestration for audit {audit_id}")
        
        # Get all scan types to run
        scans_to_run = audit.scans.filter(status='pending').order_by('id')
        
        # Execute scans sequentially
        for scan in scans_to_run:
            try:
                logger.info(f"[SecurityAudit] Executing scan {scan.id}: {scan.scan_type}")
                execute_security_scan(scan.id)
                scan.refresh_from_db()
                
                # Update audit statistics after each scan
                audit.update_statistics()
                
            except Exception as e:
                logger.error(f"[SecurityAudit] Error executing scan {scan.id}: {str(e)}")
                scan.status = 'failed'
                scan.save()
                audit.update_statistics()
        
        # Mark audit as completed
        audit.status = 'completed'
        audit.completed_at = timezone.now()
        audit.update_statistics()
        audit.save()
        
        logger.info(f"[SecurityAudit] Completed audit {audit_id}")
        
    except SecurityAudit.DoesNotExist:
        logger.error(f"[SecurityAudit] Audit {audit_id} not found")
    except Exception as e:
        logger.error(f"[SecurityAudit] Error orchestrating audit {audit_id}: {str(e)}")
        try:
            audit = SecurityAudit.objects.get(id=audit_id)
            audit.status = 'failed'
            audit.save()
        except:
            pass


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('security_monitoring.view')])
def create_audit(request):
    """
    Create a new security audit and orchestrate all scans
    """
    try:
        serializer = SecurityAuditCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        target_url = serializer.validated_data['target_url']
        scan_types = serializer.validated_data.get('scan_types', ['all'])
        
        # Determine which scan types to run
        if 'all' in scan_types:
            scan_types_to_run = [choice[0] for choice in SecurityScan.SCAN_TYPES]
        else:
            scan_types_to_run = scan_types
        
        # Create audit
        audit = SecurityAudit.objects.create(
            target_url=target_url,
            status='pending',
            created_by=request.user
        )
        
        # Create scans for each scan type
        created_scans = []
        for scan_type in scan_types_to_run:
            # Determine tool to use (will be auto-selected in execute_security_scan)
            scan = SecurityScan.objects.create(
                scan_type=scan_type,
                target_url=target_url,
                status='pending',
                audit=audit,
                created_by=request.user,
                scan_config={}
            )
            created_scans.append(scan)
        
        # Update audit statistics
        audit.total_scans = len(created_scans)
        audit.save()
        
        # Start orchestration in background thread
        thread = threading.Thread(target=orchestrate_audit_scans, args=(audit.id,))
        thread.daemon = True
        thread.start()
        
        # Return audit with scans
        audit_serializer = SecurityAuditSerializer(audit)
        scans_serializer = SecurityScanSerializer(created_scans, many=True)
        
        return Response({
            'audit': audit_serializer.data,
            'scans': scans_serializer.data,
            'message': f'Security audit created with {len(created_scans)} scans. Orchestration started.'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"[SecurityAudit] Error creating audit: {str(e)}")
        import traceback
        error_trace = traceback.format_exc()
        return Response({
            'error': str(e),
            'detail': 'Error occurred while creating the audit',
            'traceback': error_trace if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasFeaturePermission('security_monitoring.view')])
def audit_detail(request, pk):
    """
    Get security audit details with scans and findings
    """
    try:
        audit = SecurityAudit.objects.get(pk=pk)
        
        # Update statistics
        audit.update_statistics()
        
        audit_serializer = SecurityAuditSerializer(audit)
        scans = audit.scans.all().order_by('created_at')
        scans_serializer = SecurityScanSerializer(scans, many=True)
        
        # Get findings grouped by category
        findings_by_category = {}
        for category in SCAN_CATEGORY_MAP.values():
            findings_by_category[category] = []
        
        for scan in scans:
            category = SCAN_CATEGORY_MAP.get(scan.scan_type, 'other')
            findings = scan.findings.all()
            findings_serializer = SecurityFindingSerializer(findings, many=True)
            findings_by_category[category].extend(findings_serializer.data)
        
        return Response({
            'audit': audit_serializer.data,
            'scans': scans_serializer.data,
            'findings_by_category': findings_by_category
        })
        
    except SecurityAudit.DoesNotExist:
        return Response({'error': 'Audit not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"[SecurityAudit] Error getting audit {pk}: {str(e)}")
        return Response({
            'error': str(e),
            'detail': 'Error occurred while retrieving the audit'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasFeaturePermission('security_monitoring.view')])
def audit_list(request):
    """
    List all security audits for the current user
    """
    try:
        audits = SecurityAudit.objects.filter(created_by=request.user).order_by('-created_at')
        serializer = SecurityAuditSerializer(audits, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"[SecurityAudit] Error listing audits: {str(e)}")
        return Response({
            'error': str(e),
            'detail': 'Error occurred while listing audits'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

