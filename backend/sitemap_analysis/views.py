"""
API endpoints for Sitemap Analysis
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from datetime import datetime
import traceback
from core.analysis_utils import get_user_from_request, get_audit_report
from .models import SitemapAnalysis
from .parsers import parse_sitemap_data


@api_view(['POST'])
@permission_classes([AllowAny])
def save_sitemap_analysis(request):
    """
    Save sitemap analysis results to SitemapAnalysis table.
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
        
        # Parse last_modified if it's a string
        last_modified = data.get('last_modified')
        if last_modified and isinstance(last_modified, str):
            try:
                last_modified = datetime.fromisoformat(last_modified.replace('Z', '+00:00'))
            except:
                last_modified = None
        
        analysis = SitemapAnalysis.objects.create(
            url=url,
            user=user,
            audit_report=audit_report,
            sitemap_found=data.get('sitemap_found', False),
            sitemap_url=data.get('sitemap_url', ''),
            sitemap_type=data.get('sitemap_type', ''),
            total_urls=data.get('total_urls'),
            last_modified=last_modified,
            change_frequency=data.get('change_frequency', ''),
            priority=data.get('priority'),
            urls=data.get('urls', []),
            is_sitemap_index=data.get('is_sitemap_index', False),
            sitemap_index_urls=data.get('sitemap_index_urls', []),
            issues=data.get('issues', []),
            recommendations=data.get('recommendations', []),
            health_score=data.get('health_score'),
            full_results=data.get('full_results', data),
        )
        
        # Parse data from full_results into table columns
        try:
            parse_sitemap_data(analysis)
            print(f"[SaveSitemap] Sitemap data parsing completed")
        except Exception as parse_error:
            print(f"[SaveSitemap] Error parsing Sitemap data: {parse_error}")
            import traceback
            print(traceback.format_exc())
            # Don't fail the request if parsing fails
        
        return Response({
            'success': True,
            'id': analysis.id,
            'message': 'Sitemap analysis saved successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[SaveSitemap] Error: {str(e)}")
        print(f"[SaveSitemap] Traceback: {error_trace}")
        return Response({
            'success': False,
            'error': str(e),
            'traceback': error_trace if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

