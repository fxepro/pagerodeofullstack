"""
API endpoints for SSL Analysis
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from datetime import datetime
import traceback
from core.analysis_utils import get_user_from_request, get_audit_report
from .models import SSLAnalysis
from .parsers import parse_ssl_data


@api_view(['POST'])
@permission_classes([AllowAny])
def save_ssl_analysis(request):
    """
    Save SSL analysis results to SSLAnalysis table.
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
        
        # Parse expires_at if it's a string
        expires_at = data.get('expires_at')
        if expires_at and isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            except:
                expires_at = None
        
        analysis = SSLAnalysis.objects.create(
            url=url,
            user=user,
            audit_report=audit_report,
            is_valid=data.get('is_valid', False),
            expires_at=expires_at,
            days_until_expiry=data.get('days_until_expiry'),
            issuer=data.get('issuer', ''),
            subject=data.get('subject', ''),
            serial_number=data.get('serial_number', ''),
            root_ca_valid=data.get('root_ca_valid', True),
            intermediate_valid=data.get('intermediate_valid', True),
            certificate_valid=data.get('certificate_valid', True),
            protocol=data.get('protocol', ''),
            cipher_suite=data.get('cipher_suite', ''),
            certificate_chain=data.get('certificate_chain', []),
            san_domains=data.get('san_domains', []),
            ssl_health_score=data.get('ssl_health_score'),
            issues=data.get('issues', []),
            recommendations=data.get('recommendations', []),
            full_results=data.get('full_results', data),
        )
        
        # Parse data from full_results into table columns
        try:
            parse_ssl_data(analysis)
            print(f"[SaveSSL] SSL data parsing completed")
        except Exception as parse_error:
            print(f"[SaveSSL] Error parsing SSL data: {parse_error}")
            import traceback
            print(traceback.format_exc())
            # Don't fail the request if parsing fails
        
        return Response({
            'success': True,
            'id': analysis.id,
            'message': 'SSL analysis saved successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[SaveSSL] Error: {str(e)}")
        print(f"[SaveSSL] Traceback: {error_trace}")
        return Response({
            'success': False,
            'error': str(e),
            'traceback': error_trace if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

