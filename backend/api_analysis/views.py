"""
API endpoints for API Analysis
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import traceback
from core.analysis_utils import get_user_from_request, get_audit_report
from .models import APIAnalysis
from .parsers import parse_api_data


@api_view(['POST'])
@permission_classes([AllowAny])
def save_api_analysis(request):
    """
    Save API analysis results to APIAnalysis table.
    """
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
        
        # Calculate summary statistics if not provided
        endpoints = data.get('endpoints', [])
        if endpoints and not data.get('total_endpoints'):
            data['total_endpoints'] = len(endpoints)
        
        # Calculate endpoints_by_method if not provided
        if endpoints and not data.get('endpoints_by_method'):
            method_counts = {}
            for endpoint in endpoints:
                method = endpoint.get('method', 'GET')
                method_counts[method] = method_counts.get(method, 0) + 1
            data['endpoints_by_method'] = method_counts
        
        # Calculate endpoints_by_status if not provided
        if endpoints and not data.get('endpoints_by_status'):
            status_counts = {}
            for endpoint in endpoints:
                status_code = endpoint.get('status_code', 200)
                status_counts[status_code] = status_counts.get(status_code, 0) + 1
            data['endpoints_by_status'] = status_counts
        
        analysis = APIAnalysis.objects.create(
            url=url,
            user=user,
            audit_report=audit_report,
            endpoints=endpoints,
            total_endpoints=data.get('total_endpoints'),
            endpoints_by_method=data.get('endpoints_by_method', {}),
            endpoints_by_status=data.get('endpoints_by_status', {}),
            api_health_score=data.get('api_health_score'),
            issues=data.get('issues', []),
            recommendations=data.get('recommendations', []),
            response_types=data.get('response_types', []),
            auth_methods=data.get('auth_methods', []),
            requires_auth=data.get('requires_auth'),
            full_results=data.get('full_results', data),
        )
        
        # Parse data from full_results into table columns
        try:
            parse_api_data(analysis)
            print(f"[SaveAPI] API data parsing completed")
        except Exception as parse_error:
            print(f"[SaveAPI] Error parsing API data: {parse_error}")
            import traceback
            print(traceback.format_exc())
            # Don't fail the request if parsing fails
        
        return Response({
            'success': True,
            'id': analysis.id,
            'message': 'API analysis saved successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[SaveAPI] Error: {str(e)}")
        print(f"[SaveAPI] Traceback: {error_trace}")
        return Response({
            'success': False,
            'error': str(e),
            'traceback': error_trace if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

