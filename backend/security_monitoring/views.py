"""
API views for Security Monitoring
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Count, Q
from django.conf import settings
from datetime import timedelta
from users.permission_classes import HasFeaturePermission
from .models import SecurityScan, SecurityFinding, SecurityScanSchedule, SecurityTool
from .serializers import (
    SecurityScanSerializer,
    SecurityScanCreateSerializer,
    SecurityFindingSerializer,
    SecurityScanScheduleSerializer,
    SecurityToolSerializer
)
from .utils import execute_security_scan
import logging

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('security_monitoring.view')])
def scans_list(request):
    """List all security scans or create a new one"""
    if request.method == 'GET':
        try:
            scans = SecurityScan.objects.all().select_related('created_by').prefetch_related('findings')
            
            # Filters
            scan_type = request.GET.get('scan_type')
            status_filter = request.GET.get('status')
            search = request.GET.get('search')
            
            if scan_type:
                scans = scans.filter(scan_type=scan_type)
            if status_filter:
                scans = scans.filter(status=status_filter)
            if search:
                scans = scans.filter(
                    Q(target_url__icontains=search) |
                    Q(tool_used__icontains=search)
                )
            
            scans = scans.order_by('-created_at')
            serializer = SecurityScanSerializer(scans, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Handle case where tables don't exist yet
            import traceback
            return Response([], status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        try:
            # Handle data - convert to dict if needed
            data = request.data.copy()
            if hasattr(data, 'dict'):
                data = data.dict()
            
            print(f"[SecurityScan] Creating scan with data: {data}")
            
            # Ensure scan_config is a dict
            if 'scan_config' in data and not isinstance(data['scan_config'], dict):
                if isinstance(data['scan_config'], str):
                    import json
                    try:
                        data['scan_config'] = json.loads(data['scan_config'])
                    except:
                        data['scan_config'] = {}
                else:
                    data['scan_config'] = {}
            elif 'scan_config' not in data:
                data['scan_config'] = {}
            
            # Handle scheduled_at - convert empty string or null to None
            if 'scheduled_at' in data:
                if data['scheduled_at'] == '' or data['scheduled_at'] is None or data['scheduled_at'] == 'null':
                    data['scheduled_at'] = None
            else:
                data['scheduled_at'] = None
            
            # Ensure tool_used is not empty
            if 'tool_used' not in data or not data['tool_used'] or data['tool_used'].strip() == '':
                # Try to get default tool from scan_type
                scan_type = data.get('scan_type', '')
                from .models import SecurityScan
                tool_map = {
                    'dns_discovery': 'amass',
                    'port_scan': 'Nmap',
                    'vulnerability_scan': 'Nessus',
                    'dast': 'OWASP ZAP',
                    'misconfiguration_scan': 'Nikto',
                    'ssl_check': 'Qualys SSL Labs',
                    'cms_scan': 'WPScan',
                    'sql_injection': 'sqlmap',
                    'headers_check': 'securityheaders.io',
                    'continuous_monitoring': 'Detectify',
                    'manual_pentest': 'Burp Suite',
                }
                data['tool_used'] = tool_map.get(scan_type, 'Manual')
            
            print(f"[SecurityScan] Processed data: {data}")
            
            serializer = SecurityScanCreateSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                try:
                    scan = serializer.save()
                    
                    # Auto-execute scan if not scheduled for future
                    auto_run = data.get('auto_run', True)  # Default to True for immediate execution
                    if auto_run and not scan.scheduled_at:
                        try:
                            # Execute scan in background (synchronously for now)
                            execute_security_scan(scan.id)
                            scan.refresh_from_db()
                            logger.info(f"[SecurityScan] Auto-executed scan {scan.id}")
                        except Exception as exec_error:
                            # If execution fails, scan remains in pending state
                            logger.warning(f"[SecurityScan] Auto-execution failed for scan {scan.id}: {str(exec_error)}")
                            # Don't fail the creation, just log the warning
                    
                    response_serializer = SecurityScanSerializer(scan)
                    print(f"[SecurityScan] Successfully created scan: {scan.id}")
                    return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                except Exception as save_error:
                    import traceback
                    save_trace = traceback.format_exc()
                    print(f"[SecurityScan] Error saving scan: {str(save_error)}")
                    print(f"[SecurityScan] Save traceback: {save_trace}")
                    return Response({
                        'error': str(save_error),
                        'detail': 'Error occurred while saving the scan',
                        'traceback': save_trace if settings.DEBUG else None
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                print(f"[SecurityScan] Serializer errors: {serializer.errors}")
                return Response({
                    'error': 'Validation failed',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"[SecurityScan] Error creating security scan: {str(e)}")
            print(f"[SecurityScan] Traceback: {error_trace}")
            return Response({
                'error': str(e),
                'detail': 'An error occurred while creating the security scan',
                'traceback': error_trace if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('security_monitoring.view')])
def run_scan(request, pk):
    """Run/execute a security scan"""
    try:
        scan = SecurityScan.objects.get(pk=pk)
        
        if scan.status == 'running':
            return Response({
                'error': 'Scan is already running',
                'detail': f'Scan {pk} is currently in progress'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if scan.status == 'completed':
            return Response({
                'error': 'Scan already completed',
                'detail': f'Scan {pk} has already been completed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Execute the scan (this will update status to running, then completed/failed)
        try:
            execute_security_scan(pk)
            scan.refresh_from_db()
            serializer = SecurityScanSerializer(scan)
            return Response({
                'message': 'Scan started successfully',
                'scan': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"[SecurityScan] Error running scan {pk}: {str(e)}")
            logger.error(f"[SecurityScan] Traceback: {error_trace}")
            return Response({
                'error': str(e),
                'detail': 'Error occurred while running the scan',
                'traceback': error_trace if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except SecurityScan.DoesNotExist:
        return Response({'error': 'Scan not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, HasFeaturePermission('security_monitoring.view')])
def scan_detail(request, pk):
    """Get, update, or delete a specific security scan"""
    try:
        scan = SecurityScan.objects.get(pk=pk)
    except SecurityScan.DoesNotExist:
        return Response({'error': 'Scan not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = SecurityScanSerializer(scan)
        findings = scan.findings.all().order_by('-severity', '-created_at')
        findings_serializer = SecurityFindingSerializer(findings, many=True)
        
        return Response({
            'scan': serializer.data,
            'findings': findings_serializer.data,
            'summary': {
                'total_findings': findings.count(),
                'critical': findings.filter(severity='critical').count(),
                'high': findings.filter(severity='high').count(),
                'medium': findings.filter(severity='medium').count(),
                'low': findings.filter(severity='low').count(),
                'informational': findings.filter(severity='informational').count(),
            }
        })
    
    elif request.method == 'PUT':
        if not request.user.has_perm('security_monitoring.edit'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = SecurityScanSerializer(scan, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if not request.user.has_perm('security_monitoring.delete'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        scan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasFeaturePermission('security_monitoring.view')])
def findings_list(request):
    """List all security findings with filters"""
    try:
        findings = SecurityFinding.objects.all().select_related('scan', 'assigned_to')
        
        # Filters
        severity = request.GET.get('severity')
        status_filter = request.GET.get('status')
        scan_type = request.GET.get('scan_type')
        search = request.GET.get('search')
        
        if severity:
            findings = findings.filter(severity=severity)
        if status_filter:
            findings = findings.filter(status=status_filter)
        if scan_type:
            findings = findings.filter(scan__scan_type=scan_type)
        if search:
            findings = findings.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(cve_id__icontains=search)
            )
        
        findings = findings.order_by('-severity', '-created_at')
        serializer = SecurityFindingSerializer(findings, many=True)
        return Response(serializer.data)
    except Exception as e:
        # Handle case where tables don't exist yet
        import traceback
        return Response([], status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, HasFeaturePermission('security_monitoring.view')])
def finding_detail(request, pk):
    """Get or update a specific finding"""
    try:
        finding = SecurityFinding.objects.get(pk=pk)
    except SecurityFinding.DoesNotExist:
        return Response({'error': 'Finding not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = SecurityFindingSerializer(finding)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        if not request.user.has_perm('security_monitoring.edit'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = SecurityFindingSerializer(finding, data=request.data, partial=True)
        if serializer.is_valid():
            # If status is being set to resolved, set resolved_at
            if 'status' in request.data and request.data['status'] == 'resolved':
                serializer.save(resolved_at=timezone.now())
            else:
                serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasFeaturePermission('security_monitoring.view')])
def security_stats(request):
    """Get overall security monitoring statistics"""
    try:
        # Total scans (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        total_scans = SecurityScan.objects.filter(created_at__gte=thirty_days_ago).count()
        
        # Active scans
        active_scans = SecurityScan.objects.filter(status='running').count()
        
        # Findings by severity
        critical_findings = SecurityFinding.objects.filter(severity='critical', status__in=['new', 'confirmed']).count()
        high_findings = SecurityFinding.objects.filter(severity='high', status__in=['new', 'confirmed']).count()
        
        # Recent scans
        recent_scans = SecurityScan.objects.filter(
            created_at__gte=thirty_days_ago
        ).order_by('-created_at')[:10]
        
        return Response({
            'total_scans': total_scans,
            'active_scans': active_scans,
            'critical_findings': critical_findings,
            'high_findings': high_findings,
            'recent_scans': SecurityScanSerializer(recent_scans, many=True).data
        })
    except Exception as e:
        # Handle case where tables don't exist yet
        import traceback
        return Response({
            'total_scans': 0,
            'active_scans': 0,
            'critical_findings': 0,
            'high_findings': 0,
            'recent_scans': [],
            'error': str(e)
        }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, HasFeaturePermission('security_monitoring.view')])
def schedules_list(request):
    """List all scheduled scans or create a new one"""
    if request.method == 'GET':
        schedules = SecurityScanSchedule.objects.all().select_related('created_by')
        schedules = schedules.order_by('-created_at')
        serializer = SecurityScanScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not request.user.has_perm('security_monitoring.create'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        data['created_by'] = request.user.id
        serializer = SecurityScanScheduleSerializer(data=data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Import tools views at the end to avoid circular imports
from .views_tools import tools_list, tool_detail
