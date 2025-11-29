"""
API views for monitoring data endpoints.
"""

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Avg, Min, Max, Q
from django.db.models.functions import TruncDate
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from monitoring.models import StatusCheck, Incident, LinkCheck, DiscoveredLink
from users.models import MonitoredSite
import logging

logger = logging.getLogger('pagerodeo')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def site_history(request, site_id):
    """
    Get historical check data for a monitored site.
    
    Query parameters:
    - start_date: Start date in YYYY-MM-DD format (optional)
    - end_date: End date in YYYY-MM-DD format (optional)
    - days: Number of days to look back (default: 30)
    
    Returns array of check records for charts.
    """
    try:
        # Get site (must belong to user)
        site = get_object_or_404(MonitoredSite, id=site_id, user=request.user)
        
        # Parse query parameters
        days = int(request.query_params.get('days', 30))
        end_date_str = request.query_params.get('end_date')
        start_date_str = request.query_params.get('start_date')
        
        # Calculate date range
        if end_date_str:
            try:
                end_date = timezone.datetime.strptime(end_date_str, '%Y-%m-%d').date()
                end_datetime = timezone.make_aware(timezone.datetime.combine(end_date, timezone.datetime.max.time()))
            except ValueError:
                return Response({'error': 'Invalid end_date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            end_datetime = timezone.now()
        
        if start_date_str:
            try:
                start_date = timezone.datetime.strptime(start_date_str, '%Y-%m-%d').date()
                start_datetime = timezone.make_aware(timezone.datetime.combine(start_date, timezone.datetime.min.time()))
            except ValueError:
                return Response({'error': 'Invalid start_date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            start_datetime = end_datetime - timedelta(days=days-1)
            start_datetime = timezone.make_aware(timezone.datetime.combine(start_datetime.date(), timezone.datetime.min.time()))
        
        # Query StatusCheck records
        checks = StatusCheck.objects.filter(
            site=site,
            checked_at__gte=start_datetime,
            checked_at__lte=end_datetime
        ).order_by('checked_at')
        
        # Serialize data
        data = []
        for check in checks:
            data.append({
                'checked_at': check.checked_at.isoformat(),
                'status': check.status,
                'response_time': check.response_time,
                'status_code': check.status_code,
                'error_message': check.error_message if check.error_message else None,
            })
        
        return Response({
            'success': True,
            'data': data,
            'count': len(data),
            'start_date': start_datetime.date().isoformat(),
            'end_date': end_datetime.date().isoformat()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f'[SiteHistory] Error: {str(e)}', exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def site_uptime(request, site_id):
    """
    Calculate uptime percentages for a monitored site.
    
    Query parameters:
    - period: '24h', '7d', '30d', or 'all' (default: 'all')
    
    Returns uptime percentages and statistics.
    """
    try:
        # Get site (must belong to user)
        site = get_object_or_404(MonitoredSite, id=site_id, user=request.user)
        
        period = request.query_params.get('period', 'all')
        
        # Calculate time ranges
        now = timezone.now()
        periods = {
            '24h': now - timedelta(hours=24),
            '7d': now - timedelta(days=7),
            '30d': now - timedelta(days=30),
        }
        
        result = {}
        
        if period == 'all':
            periods_to_calc = ['24h', '7d', '30d']
        else:
            periods_to_calc = [period]
        
        for p in periods_to_calc:
            cutoff = periods[p]
            checks = StatusCheck.objects.filter(
                site=site,
                checked_at__gte=cutoff
            )
            
            total_checks = checks.count()
            if total_checks == 0:
                result[f'uptime_{p}'] = 100.0
                result[f'total_checks_{p}'] = 0
                result[f'successful_checks_{p}'] = 0
                result[f'failed_checks_{p}'] = 0
            else:
                successful_checks = checks.filter(status='up').count()
                failed_checks = total_checks - successful_checks
                uptime_percentage = (successful_checks / total_checks) * 100.0
                
                result[f'uptime_{p}'] = round(uptime_percentage, 3)
                result[f'total_checks_{p}'] = total_checks
                result[f'successful_checks_{p}'] = successful_checks
                result[f'failed_checks_{p}'] = failed_checks
            
            # Count incidents in period
            incidents = Incident.objects.filter(
                site=site,
                started_at__gte=cutoff
            ).count()
            result[f'incidents_{p}'] = incidents
        
        result['success'] = True
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f'[SiteUptime] Error: {str(e)}', exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def site_incidents(request, site_id):
    """
    Get incident history for a monitored site.
    
    Query parameters:
    - status: 'ongoing', 'resolved', or 'all' (default: 'all')
    - limit: Maximum number of incidents to return (default: 10)
    
    Returns array of incident records.
    """
    try:
        # Get site (must belong to user)
        site = get_object_or_404(MonitoredSite, id=site_id, user=request.user)
        
        status_filter = request.query_params.get('status', 'all')
        limit = int(request.query_params.get('limit', 10))
        
        # Query incidents
        incidents_query = Incident.objects.filter(site=site)
        
        if status_filter != 'all':
            incidents_query = incidents_query.filter(status=status_filter)
        
        incidents = incidents_query.order_by('-started_at')[:limit]
        
        # Serialize data
        data = []
        for incident in incidents:
            data.append({
                'id': incident.id,
                'status': incident.status,
                'impact': incident.impact,
                'started_at': incident.started_at.isoformat(),
                'resolved_at': incident.resolved_at.isoformat() if incident.resolved_at else None,
                'duration_minutes': incident.duration_minutes,
                'root_cause': incident.root_cause,
                'affected_services': incident.affected_services,
                'resolution_steps': incident.resolution_steps,
            })
        
        return Response({
            'success': True,
            'incidents': data,
            'count': len(data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f'[SiteIncidents] Error: {str(e)}', exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def site_stats(request, site_id):
    """
    Get aggregated statistics for a monitored site.
    
    Returns average, min, max response times, total checks, uptime, and incident count.
    """
    try:
        # Get site (must belong to user)
        site = get_object_or_404(MonitoredSite, id=site_id, user=request.user)
        
        # Get checks from last 30 days
        cutoff = timezone.now() - timedelta(days=30)
        checks = StatusCheck.objects.filter(
            site=site,
            checked_at__gte=cutoff
        )
        
        # Calculate statistics
        total_checks = checks.count()
        
        if total_checks == 0:
            return Response({
                'success': True,
                'avg_response_time': 0,
                'min_response_time': 0,
                'max_response_time': 0,
                'total_checks': 0,
                'uptime_percentage': 100.0,
                'incident_count': 0
            }, status=status.HTTP_200_OK)
        
        stats = checks.aggregate(
            avg_response_time=Avg('response_time'),
            min_response_time=Min('response_time'),
            max_response_time=Max('response_time')
        )
        
        successful_checks = checks.filter(status='up').count()
        uptime_percentage = (successful_checks / total_checks) * 100.0
        
        incident_count = Incident.objects.filter(
            site=site,
            started_at__gte=cutoff
        ).count()
        
        return Response({
            'success': True,
            'avg_response_time': round(stats['avg_response_time'] or 0),
            'min_response_time': stats['min_response_time'] or 0,
            'max_response_time': stats['max_response_time'] or 0,
            'total_checks': total_checks,
            'uptime_percentage': round(uptime_percentage, 3),
            'incident_count': incident_count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f'[SiteStats] Error: {str(e)}', exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def page_history(request, link_id):
    """
    Get historical check data for a discovered page/link.
    
    Query parameters:
    - start_date: Start date in YYYY-MM-DD format (optional)
    - end_date: End date in YYYY-MM-DD format (optional)
    - days: Number of days to look back (default: 30)
    
    Returns array of page check records.
    """
    try:
        # Get link (must belong to user's site)
        link = get_object_or_404(DiscoveredLink, id=link_id, site__user=request.user)
        
        # Parse query parameters
        days = int(request.query_params.get('days', 30))
        end_date_str = request.query_params.get('end_date')
        start_date_str = request.query_params.get('start_date')
        
        # Calculate date range
        if end_date_str:
            try:
                end_date = timezone.datetime.strptime(end_date_str, '%Y-%m-%d').date()
                end_datetime = timezone.make_aware(timezone.datetime.combine(end_date, timezone.datetime.max.time()))
            except ValueError:
                return Response({'error': 'Invalid end_date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            end_datetime = timezone.now()
        
        if start_date_str:
            try:
                start_date = timezone.datetime.strptime(start_date_str, '%Y-%m-%d').date()
                start_datetime = timezone.make_aware(timezone.datetime.combine(start_date, timezone.datetime.min.time()))
            except ValueError:
                return Response({'error': 'Invalid start_date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            start_datetime = end_datetime - timedelta(days=days-1)
            start_datetime = timezone.make_aware(timezone.datetime.combine(start_datetime.date(), timezone.datetime.min.time()))
        
        # Query LinkCheck records
        checks = LinkCheck.objects.filter(
            link=link,
            checked_at__gte=start_datetime,
            checked_at__lte=end_datetime
        ).order_by('checked_at')
        
        # Serialize data
        data = []
        for check in checks:
            data.append({
                'checked_at': check.checked_at.isoformat(),
                'status': check.status,
                'status_text': check.status_text,
                'response_time': check.response_time,
                'error_message': check.error_message if check.error_message else None,
                'redirect_url': check.redirect_url if check.redirect_url else None,
            })
        
        return Response({
            'success': True,
            'data': data,
            'count': len(data),
            'start_date': start_datetime.date().isoformat(),
            'end_date': end_datetime.date().isoformat()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f'[PageHistory] Error: {str(e)}', exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def page_stats(request, link_id):
    """
    Get aggregated statistics for a discovered page/link.
    
    Returns current status, average, min, max response times, total checks, and uptime.
    """
    try:
        # Get link (must belong to user's site)
        link = get_object_or_404(DiscoveredLink, id=link_id, site__user=request.user)
        
        # Get checks from last 30 days
        cutoff = timezone.now() - timedelta(days=30)
        checks = LinkCheck.objects.filter(
            link=link,
            checked_at__gte=cutoff
        )
        
        # Calculate statistics
        total_checks = checks.count()
        
        if total_checks == 0:
            return Response({
                'success': True,
                'current_status': link.current_status,
                'avg_response_time': 0,
                'min_response_time': 0,
                'max_response_time': 0,
                'total_checks': 0,
                'uptime_percentage': 100.0
            }, status=status.HTTP_200_OK)
        
        stats = checks.aggregate(
            avg_response_time=Avg('response_time'),
            min_response_time=Min('response_time'),
            max_response_time=Max('response_time')
        )
        
        # Calculate uptime (status 200-299 is considered "up")
        successful_checks = checks.filter(status__gte=200, status__lt=300).count()
        uptime_percentage = (successful_checks / total_checks) * 100.0
        
        # Get latest check for current status
        latest_check = checks.order_by('-checked_at').first()
        current_status = latest_check.status if latest_check else link.current_status
        
        return Response({
            'success': True,
            'current_status': current_status,
            'avg_response_time': round(stats['avg_response_time'] or 0),
            'min_response_time': stats['min_response_time'] or 0,
            'max_response_time': stats['max_response_time'] or 0,
            'total_checks': total_checks,
            'uptime_percentage': round(uptime_percentage, 3)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f'[PageStats] Error: {str(e)}', exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

