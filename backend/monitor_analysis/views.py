"""
API endpoints for Monitor Analysis
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import traceback
from core.analysis_utils import get_user_from_request, get_audit_report
from .models import MonitorAnalysis
from .parsers import parse_monitor_data


@api_view(['POST'])
@permission_classes([AllowAny])
def save_monitor_analysis(request):
    """
    Save monitor analysis results to MonitorAnalysis table.
    """
    print("="*60)
    print("[SaveMonitor] REQUEST RECEIVED")
    print("="*60)
    print(f"[SaveMonitor] Data keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'N/A'}")
    print(f"[SaveMonitor] URL: {request.data.get('url', 'NOT PROVIDED')}")
    print(f"[SaveMonitor] Status: {request.data.get('status', 'NOT PROVIDED')}")
    print(f"[SaveMonitor] Response time: {request.data.get('responseTime', 'NOT PROVIDED')}")
    
    try:
        user = get_user_from_request(request)
        audit_report = get_audit_report(request.data.get('audit_report_id'))
        
        data = request.data.copy()
        url = data.pop('url', None)
        if not url:
            return Response({
                'success': False,
                'error': 'url is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        audit_report_id = data.pop('audit_report_id', None)
        
        # Map status from API response
        status_value = data.get('status', 'down')
        if status_value not in ['up', 'down', 'checking']:
            # Normalize status values
            if status_value in ['online', 'ok', 'success']:
                status_value = 'up'
            elif status_value in ['offline', 'error', 'failed']:
                status_value = 'down'
            else:
                status_value = 'checking'
        
        # Extract SSL info from nested structure
        ssl_info = data.get('ssl') or {}
        
        analysis = MonitorAnalysis.objects.create(
            url=url,
            user=user,
            audit_report=audit_report,
            status=status_value,
            status_code=data.get('statusCode'),
            response_time=data.get('responseTime', data.get('response_time', 0)),
            ssl_valid=ssl_info.get('valid') if ssl_info else None,
            ssl_expires_in=ssl_info.get('expiresIn') if ssl_info else None,
            ssl_issuer=ssl_info.get('issuer', '') if ssl_info else '',
            server=data.get('headers', {}).get('server', '') if isinstance(data.get('headers'), dict) else '',
            content_type=data.get('headers', {}).get('contentType', '') if isinstance(data.get('headers'), dict) else '',
            error_message=data.get('error', ''),
            uptime_percentage=data.get('uptimePercentage', data.get('uptime_percentage')),
            total_checks=data.get('totalChecks', data.get('total_checks')),
            successful_checks=data.get('successfulChecks', data.get('successful_checks')),
            failed_checks=data.get('failedChecks', data.get('failed_checks')),
            avg_response_time=data.get('avgResponseTime', data.get('avg_response_time')),
            min_response_time=data.get('minResponseTime', data.get('min_response_time')),
            max_response_time=data.get('maxResponseTime', data.get('max_response_time')),
            health_score=data.get('healthScore', data.get('health_score')),
            issues=data.get('issues', []),
            recommendations=data.get('recommendations', []),
            full_results=data.get('full_results', data),
        )
        
        print(f"[SaveMonitor] MonitorAnalysis created: ID={analysis.id}")
        print("="*60)
        
        # Parse data from full_results into table columns
        try:
            parse_monitor_data(analysis)
            print(f"[SaveMonitor] Monitor data parsing completed")
        except Exception as parse_error:
            print(f"[SaveMonitor] Error parsing Monitor data: {parse_error}")
            import traceback
            print(traceback.format_exc())
            # Don't fail the request if parsing fails
        
        return Response({
            'success': True,
            'id': analysis.id,
            'message': 'Monitor analysis saved successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[SaveMonitor] ========================================")
        print(f"[SaveMonitor] ERROR: {str(e)}")
        print(f"[SaveMonitor] ========================================")
        print(f"[SaveMonitor] Traceback: {error_trace}")
        print(f"[SaveMonitor] Data received keys: {list(data.keys()) if hasattr(data, 'keys') else 'N/A'}")
        print(f"[SaveMonitor] ========================================")
        return Response({
            'success': False,
            'error': str(e),
            'traceback': error_trace if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
