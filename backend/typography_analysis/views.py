"""
API endpoints for Typography Analysis
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import traceback
from core.analysis_utils import get_user_from_request, get_audit_report
from .models import TypographyAnalysis
from .parsers import parse_typography_data


@api_view(['POST'])
@permission_classes([AllowAny])
def save_typography_analysis(request):
    """
    Save typography analysis results to TypographyAnalysis table.
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
        fonts_used = data.get('fonts_used', [])
        font_sizes = data.get('font_sizes', [])
        
        if fonts_used and not data.get('total_fonts'):
            data['total_fonts'] = len(set(fonts_used))
        
        if font_sizes:
            numeric_sizes = []
            for s in font_sizes:
                if isinstance(s, (int, float)):
                    numeric_sizes.append(float(s))
                elif isinstance(s, str):
                    # Strip common CSS units
                    cleaned = s.replace('px', '').replace('em', '').replace('rem', '').replace('%', '').strip()
                    try:
                        numeric_sizes.append(float(cleaned))
                    except (ValueError, TypeError):
                        # Skip values that can't be converted
                        continue
            
            if numeric_sizes:
                if not data.get('min_font_size'):
                    data['min_font_size'] = min(numeric_sizes)
                if not data.get('max_font_size'):
                    data['max_font_size'] = max(numeric_sizes)
                if not data.get('avg_font_size'):
                    data['avg_font_size'] = sum(numeric_sizes) / len(numeric_sizes)
        
        if font_sizes and not data.get('total_font_sizes'):
            data['total_font_sizes'] = len(set(font_sizes))
        
        analysis = TypographyAnalysis.objects.create(
            url=url,
            user=user,
            audit_report=audit_report,
            fonts_used=fonts_used,
            font_sizes=font_sizes,
            font_weights=data.get('font_weights', []),
            line_heights=data.get('line_heights', []),
            font_families=data.get('font_families', []),
            total_fonts=data.get('total_fonts'),
            total_font_sizes=data.get('total_font_sizes'),
            min_font_size=data.get('min_font_size'),
            max_font_size=data.get('max_font_size'),
            avg_font_size=data.get('avg_font_size'),
            issues=data.get('issues', []),
            recommendations=data.get('recommendations', []),
            health_score=data.get('health_score'),
            accessibility_issues=data.get('accessibility_issues', []),
            full_results=data.get('full_results', data),
        )
        
        # Parse data from full_results into table columns
        try:
            parse_typography_data(analysis)
            print(f"[SaveTypography] Typography data parsing completed")
        except Exception as parse_error:
            print(f"[SaveTypography] Error parsing Typography data: {parse_error}")
            import traceback
            print(traceback.format_exc())
            # Don't fail the request if parsing fails
        
        return Response({
            'success': True,
            'id': analysis.id,
            'message': 'Typography analysis saved successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"[SaveTypography] Error: {str(e)}")
        print(f"[SaveTypography] Traceback: {error_trace}")
        return Response({
            'success': False,
            'error': str(e),
            'traceback': error_trace if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

