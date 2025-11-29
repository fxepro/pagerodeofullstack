"""
API endpoints for DNS Analysis
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import traceback
from core.analysis_utils import get_user_from_request, get_audit_report
from .models import DNSAnalysis
from .parsers import parse_dns_data


@api_view(['POST'])
@permission_classes([AllowAny])
def save_dns_analysis(request):
    """
    Save DNS analysis results to DNSAnalysis table.
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
        
        analysis = DNSAnalysis.objects.create(
            url=url,
            user=user,
            audit_report=audit_report,
            a_records=data.get('a_records', []),
            aaaa_records=data.get('aaaa_records', []),
            mx_records=data.get('mx_records', []),
            txt_records=data.get('txt_records', []),
            cname_records=data.get('cname_records', []),
            ns_records=data.get('ns_records', []),
            soa_record=data.get('soa_record', {}),
            ptr_records=data.get('ptr_records', []),
            srv_records=data.get('srv_records', []),
            response_time_ms=data.get('response_time_ms'),
            dns_server=data.get('dns_server', ''),
            dns_server_ip=data.get('dns_server_ip'),
            dns_health_score=data.get('dns_health_score'),
            issues=data.get('issues', []),
            recommendations=data.get('recommendations', []),
            full_results=data.get('full_results', data),
        )
        
        # Parse data from full_results into table columns
        try:
            parse_dns_data(analysis)
            print(f"[SaveDNS] DNS data parsing completed")
        except Exception as parse_error:
            print(f"[SaveDNS] Error parsing DNS data: {parse_error}")
            import traceback
            print(traceback.format_exc())
            # Don't fail the request if parsing fails
        
        return Response({
            'success': True,
            'id': analysis.id,
            'message': 'DNS analysis saved successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[SaveDNS] Error: {str(e)}")
        print(f"[SaveDNS] Traceback: {error_trace}")
        return Response({
            'success': False,
            'error': str(e),
            'traceback': error_trace if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

