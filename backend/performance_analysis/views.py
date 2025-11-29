"""
API endpoints for Performance Analysis
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import traceback
from core.analysis_utils import get_user_from_request, get_audit_report
from .models import PerformanceAnalysis
from .parsers import parse_detailed_data


@api_view(['POST'])
@permission_classes([AllowAny])
def save_performance_analysis(request):
    """
    Save performance analysis results to PerformanceAnalysis table.
    
    Expected payload:
    {
        "url": "https://example.com",
        "audit_report_id": "uuid" (optional),
        "device": "desktop" | "mobile" | "tablet",
        "performance_score": 85,
        "lcp": 2.5,
        "fid": 50,
        "cls": 0.1,
        ...
    }
    """
    print("="*60)
    print("[SavePerformance] REQUEST RECEIVED")
    print("="*60)
    print(f"[SavePerformance] Method: {request.method}")
    print(f"[SavePerformance] Content-Type: {request.content_type}")
    print(f"[SavePerformance] Data keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'N/A'}")
    print(f"[SavePerformance] URL in data: {request.data.get('url', 'NOT PROVIDED')}")
    print(f"[SavePerformance] audit_report_id: {request.data.get('audit_report_id', 'NOT PROVIDED')}")
    print(f"[SavePerformance] Has full_results: {bool(request.data.get('full_results'))}")
    
    try:
        user = get_user_from_request(request)
        print(f"[SavePerformance] User: {user.username if user else 'Anonymous'}")
        audit_report = get_audit_report(request.data.get('audit_report_id'))
        print(f"[SavePerformance] Audit Report: {audit_report.id if audit_report else 'None'}")
        
        # Extract data
        data = request.data.copy()
        url = data.pop('url', None)
        if not url:
            return Response({
                'success': False,
                'error': 'url is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        device = data.pop('device', 'desktop')
        audit_report_id = data.pop('audit_report_id', None)
        
        # Create PerformanceAnalysis
        analysis = PerformanceAnalysis.objects.create(
            url=url,
            user=user,
            audit_report=audit_report,
            device=device,
            performance_score=data.get('performance_score', 0),
            lcp=data.get('lcp', 0),
            fid=data.get('fid', 0),
            cls=data.get('cls', 0),
            tti=data.get('tti'),
            tbt=data.get('tbt'),
            fcp=data.get('fcp'),
            speed_index=data.get('speed_index'),
            page_size_mb=data.get('page_size_mb'),
            request_count=data.get('request_count'),
            load_time=data.get('load_time'),
            dom_content_loaded=data.get('dom_content_loaded'),
            first_paint=data.get('first_paint'),
            accessibility_score=data.get('accessibility_score'),
            best_practices_score=data.get('best_practices_score'),
            seo_score=data.get('seo_score'),
            # resources field should be EMPTY - detailed data goes to network_request/resource_breakdown tables
            resources=[],  # Always empty - detailed resources parsed from full_results
            recommendations=data.get('recommendations', []),
            full_results=data.get('full_results', {}),
        )
        
        # Calculate changes from previous analysis
        analysis.calculate_changes()
        
        print(f"[SavePerformance] PerformanceAnalysis created: ID={analysis.id}")
        print(f"[SavePerformance] Has full_results: {bool(analysis.full_results)}")
        if analysis.full_results:
            print(f"[SavePerformance] full_results type: {type(analysis.full_results)}")
            print(f"[SavePerformance] Has lighthouseResult: {'lighthouseResult' in analysis.full_results if isinstance(analysis.full_results, dict) else False}")
        
        # Parse and save detailed data (network requests, resources, timeline events)
        # 
        # CURRENT: Synchronous parsing (works for single-site testing)
        # TODO: When ready for production scaling, move to Celery background task:
        #   from .tasks import parse_performance_details
        #   parse_performance_details.delay(analysis.id)  # Non-blocking
        #   return Response(...)  # Return immediately
        #
        try:
            parse_detailed_data(analysis)
            print(f"[SavePerformance] Detailed data parsing completed")
        except Exception as parse_error:
            print(f"[SavePerformance] Error parsing detailed data: {parse_error}")
            import traceback
            print(traceback.format_exc())
            # Don't fail the request if parsing fails
        
        print(f"[SavePerformance] Returning success response")
        print("="*60)
        
        return Response({
            'success': True,
            'id': analysis.id,
            'message': 'Performance analysis saved successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[SavePerformance] Error: {str(e)}")
        print(f"[SavePerformance] Traceback: {error_trace}")
        return Response({
            'success': False,
            'error': str(e),
            'traceback': error_trace if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_full_lighthouse_json(request, analysis_id):
    """
    Get full Lighthouse JSON for a performance analysis by ID.
    
    Can be accessed in browser or via API.
    
    Example:
    GET /api/analysis/performance/{id}/full-json/
    Browser: http://localhost:8000/api/analysis/performance/123/full-json/
    
    Optional query parameters:
    - format=json (default) - Returns JSON response
    - format=html - Returns HTML page with pretty-printed JSON
    - download=1 - Triggers file download
    """
    try:
        analysis = PerformanceAnalysis.objects.get(id=analysis_id)
        
        format_type = request.query_params.get('format', 'json').lower()
        download = request.query_params.get('download', '0') == '1'
        
        # If HTML format requested, return formatted HTML page
        if format_type == 'html':
            from django.http import HttpResponse
            import json
            
            # Prepare JSON string for display and clipboard
            json_str = json.dumps(analysis.full_results, indent=2)
            json_str_escaped = json_str.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
            
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>Lighthouse JSON - {analysis.url}</title>
    <style>
        body {{
            font-family: 'Courier New', monospace;
            margin: 20px;
            background: #1e1e1e;
            color: #d4d4d4;
        }}
        .header {{
            background: #2d2d30;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }}
        .info {{
            margin: 10px 0;
        }}
        .info strong {{
            color: #569cd6;
        }}
        .json-container {{
            background: #252526;
            padding: 20px;
            border-radius: 5px;
            overflow-x: auto;
        }}
        pre {{
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
        }}
        .actions {{
            margin: 20px 0;
        }}
        a {{
            color: #4ec9b0;
            text-decoration: none;
            margin-right: 15px;
            padding: 8px 15px;
            background: #0e639c;
            border-radius: 3px;
            display: inline-block;
        }}
        a:hover {{
            background: #1177bb;
        }}
    </style>
    <script>
        const jsonData = {json_str_escaped};
        function copyToClipboard() {{
            navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2)).then(() => {{
                alert('JSON copied to clipboard!');
            }});
        }}
    </script>
</head>
<body>
    <div class="header">
        <h1>🚀 Lighthouse JSON Viewer</h1>
        <div class="info">
            <strong>URL:</strong> {analysis.url}<br>
            <strong>Device:</strong> {analysis.device}<br>
            <strong>Analyzed:</strong> {analysis.analyzed_at.strftime('%Y-%m-%d %H:%M:%S')}<br>
            <strong>Analysis ID:</strong> {analysis.id}
        </div>
    </div>
    
    <div class="actions">
        <a href="?format=json">View as JSON</a>
        <a href="?format=json&download=1">Download JSON</a>
        <a href="#" onclick="copyToClipboard(); return false;">Copy to Clipboard</a>
        <a href="/admin/performance_analysis/performanceanalysis/{analysis.id}/change/" target="_blank">View in Admin</a>
    </div>
    
    <div class="json-container">
        <pre id="json-content">{json_str}</pre>
    </div>
</body>
</html>"""
            return HttpResponse(html_content, content_type='text/html')
        
        # Default: Return JSON response
        response_data = {
            'success': True,
            'analysis': {
                'id': analysis.id,
                'url': analysis.url,
                'device': analysis.device,
                'analyzed_at': analysis.analyzed_at.isoformat(),
                'performance_score': analysis.performance_score,
            },
            'full_results': analysis.full_results  # Complete Lighthouse JSON
        }
        
        response = Response(response_data)
        
        # If download requested, add headers to trigger download
        if download:
            filename = f"lighthouse-{analysis.url.replace('https://', '').replace('http://', '').replace('/', '-')}-{analysis.id}.json"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Type'] = 'application/json'
        
        return response
        
    except PerformanceAnalysis.DoesNotExist:
        return Response({
            'success': False,
            'error': f'Performance analysis with ID {analysis_id} not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_unique_urls(request):
    """
    Get unique URLs from performance_analysis table.
    
    Returns a list of unique URLs that have performance analysis data.
    """
    try:
        # Get distinct URLs from performance_analysis table
        unique_urls = PerformanceAnalysis.objects.values_list('url', flat=True).distinct().order_by('url')
        
        return Response({
            'success': True,
            'urls': list(unique_urls)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_performance_history(request):
    """
    Get performance analysis history for a specific URL over a date range.
    
    Query parameters:
    - url: The website URL to get history for (required)
    - start_date: Start date (YYYY-MM-DD) - default: 30 days before end_date
    - end_date: End date (YYYY-MM-DD) - default: today
    - days: Number of days to look back (default: 30) - used if dates not provided
    
    Returns daily aggregated performance metrics.
    """
    from django.utils import timezone
    from datetime import timedelta, datetime
    from django.db.models import Avg, Max, Min, Count
    from django.db.models.functions import TruncDate
    
    try:
        url = request.query_params.get('url')
        if not url:
            return Response({
                'success': False,
                'error': 'url parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse date parameters
        end_date_str = request.query_params.get('end_date')
        start_date_str = request.query_params.get('start_date')
        
        if end_date_str:
            try:
                end_date = timezone.make_aware(datetime.strptime(end_date_str, '%Y-%m-%d'))
                # Set to end of day
                end_date = end_date.replace(hour=23, minute=59, second=59)
            except ValueError:
                return Response({
                    'success': False,
                    'error': 'Invalid end_date format. Use YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            end_date = timezone.now()
        
        if start_date_str:
            try:
                start_date = timezone.make_aware(datetime.strptime(start_date_str, '%Y-%m-%d'))
                # Set to start of day
                start_date = start_date.replace(hour=0, minute=0, second=0)
            except ValueError:
                return Response({
                    'success': False,
                    'error': 'Invalid start_date format. Use YYYY-MM-DD'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # If no start_date provided, use days parameter or default to 30 days before end_date
            days = int(request.query_params.get('days', 30))
            start_date = end_date - timedelta(days=days)
            start_date = start_date.replace(hour=0, minute=0, second=0)
        
        # Get all performance analyses for this URL in the date range
        analyses = PerformanceAnalysis.objects.filter(
            url=url,
            analyzed_at__gte=start_date,
            analyzed_at__lte=end_date
        ).order_by('analyzed_at')
        
        # Group by date and aggregate
        daily_data = analyses.annotate(
            date=TruncDate('analyzed_at')
        ).values('date').annotate(
            avg_performance_score=Avg('performance_score'),
            avg_lcp=Avg('lcp'),
            avg_fid=Avg('fid'),
            avg_cls=Avg('cls'),
            avg_load_time=Avg('load_time'),
            count=Count('id')
        ).order_by('date')
        
        # Format data for charts
        chart_data = []
        for item in daily_data:
            chart_data.append({
                'date': item['date'].strftime('%Y-%m-%d'),
                'performanceScore': float(item['avg_performance_score'] or 0),
                'lcp': float(item['avg_lcp'] or 0),
                'fid': float(item['avg_fid'] or 0),
                'cls': float(item['avg_cls'] or 0),
                'loadTime': float(item['avg_load_time'] or 0),
            })
        
        return Response({
            'success': True,
            'url': url,
            'data': chart_data,
            'count': len(chart_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        return Response({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc() if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

