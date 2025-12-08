"""
API endpoints for Links Analysis
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import traceback
from core.analysis_utils import get_user_from_request, get_audit_report
from .models import LinksAnalysis
from .parsers import parse_links_data


@api_view(['POST'])
@permission_classes([AllowAny])
def save_links_analysis(request):
    """
    Save links analysis results to LinksAnalysis table.
    """
    print("="*60)
    print("[SaveLinks] REQUEST RECEIVED")
    print("="*60)
    print(f"[SaveLinks] Data keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'N/A'}")
    print(f"[SaveLinks] URL: {request.data.get('url', 'NOT PROVIDED')}")
    print(f"[SaveLinks] Has links: {bool(request.data.get('links'))}")
    print(f"[SaveLinks] Links type: {type(request.data.get('links'))}")
    if request.data.get('links'):
        links_data = request.data.get('links')
        if isinstance(links_data, list):
            print(f"[SaveLinks] Links count: {len(links_data)}")
        else:
            print(f"[SaveLinks] Links is not a list: {type(links_data)}")
    
    try:
        user = get_user_from_request(request)
        audit_report_id = request.data.get('audit_report_id')
        print(f"[SaveLinks] audit_report_id from request: {audit_report_id} (type: {type(audit_report_id)})")
        audit_report = get_audit_report(audit_report_id)
        print(f"[SaveLinks] audit_report retrieved: {audit_report.id if audit_report else 'None'}")
        
        data = request.data.copy()
        url = data.pop('url', None)
        if not url:
            return Response({
                'success': False,
                'error': 'url is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        audit_report_id = data.pop('audit_report_id', None)
        
        # Calculate summary statistics if not provided
        links = data.get('links', [])
        print(f"[SaveLinks] Raw links data type: {type(links)}")
        print(f"[SaveLinks] Raw links value (first 100 chars): {str(links)[:100]}")
        
        if not isinstance(links, list):
            print(f"[SaveLinks] WARNING: links is not a list, converting. Type: {type(links)}, Value: {str(links)[:200]}")
            # Try to convert if it's a string (JSON)
            if isinstance(links, str):
                try:
                    import json
                    links = json.loads(links)
                    print(f"[SaveLinks] Successfully parsed links from JSON string")
                except:
                    print(f"[SaveLinks] Failed to parse links from JSON string")
                    links = []
            else:
                links = [] if links is None else (links if isinstance(links, list) else [])
        
        # Check if links contains strings (URLs) or dicts (link objects)
        # If strings, try to get link objects from full_results.results
        link_objects = []
        if links and isinstance(links[0], str):
            # links is a list of URL strings, get actual link data from full_results
            full_results = data.get('full_results', {})
            if isinstance(full_results, dict) and 'results' in full_results:
                link_objects = full_results.get('results', [])
                print(f"[SaveLinks] Using full_results.results for link objects: {len(link_objects)} items")
            else:
                print(f"[SaveLinks] WARNING: links are strings but no full_results.results found")
                link_objects = []
        elif links and isinstance(links[0], dict):
            # links is already a list of link objects
            link_objects = links
            print(f"[SaveLinks] Links are already objects: {len(link_objects)} items")
        
        # Use link_objects for calculations if available, otherwise use links for count only
        if links:
            if not data.get('total_links'):
                data['total_links'] = len(links)
            
            if link_objects:
                # Use link objects for detailed calculations
                if not data.get('internal_links'):
                    data['internal_links'] = sum(1 for link in link_objects if link.get('isInternal', False) or link.get('is_internal', False))
                
                if not data.get('external_links'):
                    data['external_links'] = sum(1 for link in link_objects if not (link.get('isInternal', False) or link.get('is_internal', False)))
                
                if not data.get('broken_links'):
                    broken = [link for link in link_objects if link.get('status', 0) >= 400 or link.get('status', 0) == 0]
                    data['broken_links'] = len(broken)
                    if not data.get('broken_links_list'):
                        data['broken_links_list'] = broken
                
                if not data.get('redirect_links'):
                    data['redirect_links'] = sum(1 for link in link_objects if 300 <= link.get('status', 0) < 400)
                
                # Calculate links_by_status
                if not data.get('links_by_status'):
                    status_counts = {}
                    for link in link_objects:
                        status_code = link.get('status', 0)
                        status_counts[status_code] = status_counts.get(status_code, 0) + 1
                    data['links_by_status'] = status_counts
                
                # Calculate response time statistics
                response_times = [link.get('responseTime', 0) or link.get('response_time', 0) for link in link_objects if (link.get('responseTime', 0) or link.get('response_time', 0)) > 0]
                if response_times:
                    if not data.get('avg_response_time'):
                        data['avg_response_time'] = sum(response_times) / len(response_times)
                    if not data.get('min_response_time'):
                        data['min_response_time'] = min(response_times)
                    if not data.get('max_response_time'):
                        data['max_response_time'] = max(response_times)
        
        analysis = LinksAnalysis.objects.create(
            url=url,
            user=user,
            audit_report=audit_report,
            links=links if isinstance(links, list) else [],
            total_links=data.get('total_links'),
            internal_links=data.get('internal_links'),
            external_links=data.get('external_links'),
            broken_links=data.get('broken_links', 0),
            redirect_links=data.get('redirect_links'),
            links_by_status=data.get('links_by_status', {}),
            links_health_score=data.get('links_health_score'),
            issues=data.get('issues', []),
            recommendations=data.get('recommendations', []),
            broken_links_list=data.get('broken_links_list', []),
            avg_response_time=data.get('avg_response_time'),
            min_response_time=data.get('min_response_time'),
            max_response_time=data.get('max_response_time'),
            full_results=data.get('full_results', data),
        )
        
        print(f"[SaveLinks] LinksAnalysis created: ID={analysis.id}")
        print("="*60)
        
        # Parse data from full_results into table columns
        try:
            parse_links_data(analysis)
            print(f"[SaveLinks] Links data parsing completed")
        except Exception as parse_error:
            print(f"[SaveLinks] Error parsing Links data: {parse_error}")
            import traceback
            print(traceback.format_exc())
            # Don't fail the request if parsing fails
        
        return Response({
            'success': True,
            'id': analysis.id,
            'message': 'Links analysis saved successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[SaveLinks] ========================================")
        print(f"[SaveLinks] ERROR: {str(e)}")
        print(f"[SaveLinks] ========================================")
        print(f"[SaveLinks] Traceback: {error_trace}")
        try:
            print(f"[SaveLinks] Data received keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'N/A'}")
            print(f"[SaveLinks] URL in request: {request.data.get('url', 'NOT PROVIDED')}")
            print(f"[SaveLinks] audit_report_id in request: {request.data.get('audit_report_id', 'NOT PROVIDED')}")
        except:
            print(f"[SaveLinks] Could not access request.data")
        print(f"[SaveLinks] ========================================")
        return Response({
            'success': False,
            'error': str(e),
            'traceback': error_trace if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

