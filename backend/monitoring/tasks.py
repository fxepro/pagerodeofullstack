"""
Celery tasks for monitoring site checks and data management.
"""

import logging
from datetime import timedelta
from django.utils import timezone
from monitoring.models import StatusCheck, LinkCheck, Incident, ResponseTimeHistory, DiscoveredLink
from monitoring.utils import (
    check_site_status,
    detect_incident,
    get_sites_to_check,
    normalize_url
)
from users.models import MonitoredSite

logger = logging.getLogger('pagerodeo.jobs')

# Try to import Celery, fallback to no-op if not available
try:
    from celery import shared_task
    CELERY_AVAILABLE = True
except ImportError:
    # Celery not installed - create a dummy decorator
    CELERY_AVAILABLE = False
    def shared_task(*args, **kwargs):
        def decorator(func):
            # Return function unchanged if Celery not available
            return func
        return decorator
    logger.warning('Celery not available. Monitoring tasks will not run automatically.')


@shared_task(name='monitoring.tasks.check_monitored_sites')
def check_monitored_sites():
    """
    Check all monitored sites that are due for checking.
    Runs every minute via Celery Beat.
    """
    logger.info('[CheckMonitoredSites] Starting site checks')
    
    sites_to_check = get_sites_to_check()
    total_sites = len(sites_to_check)
    
    if total_sites == 0:
        logger.info('[CheckMonitoredSites] No sites to check')
        return {
        'status': 'success',
        'sites_checked': 0,
        'sites_up': 0,
        'sites_down': 0,
        'incidents_created': 0,
        'incidents_resolved': 0
    }
    
    logger.info(f'[CheckMonitoredSites] Checking {total_sites} sites')
    
    sites_up = 0
    sites_down = 0
    incidents_created = 0
    incidents_resolved = 0
    
    for site in sites_to_check:
        try:
            # Perform status check
            check_result = check_site_status(site.url, timeout=10)
            
            # Create StatusCheck record
            status_check = StatusCheck.objects.create(
                site=site,
                status=check_result['status'],
                response_time=check_result['response_time'],
                status_code=check_result.get('status_code'),
                error_message=check_result.get('error_message', ''),
                metadata=check_result.get('metadata', {})
            )
            
            # Update MonitoredSite
            site.status = check_result['status']
            site.response_time = check_result['response_time']
            site.last_check = timezone.now()
            site.error_message = check_result.get('error_message', '')
            
            # Update SSL info if available
            if 'ssl_valid' in check_result.get('metadata', {}):
                site.ssl_valid = check_result['metadata']['ssl_valid']
            
            site.save()
            
            # Track status counts
            if check_result['status'] == 'up':
                sites_up += 1
            else:
                sites_down += 1
            
            # Detect incidents
            incident = detect_incident(site, status_check)
            if incident:
                if incident.status == 'ongoing':
                    incidents_created += 1
                    logger.info(f'[CheckMonitoredSites] Created incident for {site.url}')
                elif incident.status == 'resolved':
                    incidents_resolved += 1
                    logger.info(f'[CheckMonitoredSites] Resolved incident for {site.url}')
            
            logger.debug(f'[CheckMonitoredSites] Checked {site.url}: {check_result["status"]} ({check_result["response_time"]}ms)')
            
        except Exception as e:
            logger.error(f'[CheckMonitoredSites] Error checking {site.url}: {str(e)}', exc_info=True)
            # Create a failed check record
            try:
                StatusCheck.objects.create(
                    site=site,
                    status='down',
                    response_time=0,
                    error_message=f'Check error: {str(e)}',
                    metadata={'error': True}
                )
                site.status = 'down'
                site.last_check = timezone.now()
                site.error_message = f'Check error: {str(e)}'
                site.save()
            except Exception as save_error:
                logger.error(f'[CheckMonitoredSites] Failed to save check result for {site.url}: {str(save_error)}')
    
    result = {
        'status': 'success',
        'sites_checked': total_sites,
        'sites_up': sites_up,
        'sites_down': sites_down,
        'incidents_created': incidents_created,
        'incidents_resolved': incidents_resolved
    }
    
    logger.info(f'[CheckMonitoredSites] Completed: {result}')
    return result


@shared_task(name='monitoring.tasks.check_discovered_pages')
def check_discovered_pages():
    """
    Check all discovered pages/links that are due for checking.
    Runs every 15 minutes via Celery Beat.
    """
    logger.info('[CheckDiscoveredPages] Starting page checks')
    
    # Get all discovered links that need checking
    # Check pages that haven't been checked in the last 15 minutes (or use page_check_interval from settings)
    cutoff_time = timezone.now() - timedelta(minutes=15)
    
    links_to_check = DiscoveredLink.objects.filter(
        last_checked__lt=cutoff_time
    ).select_related('site')[:100]  # Limit to 100 per run to avoid overload
    
    total_links = links_to_check.count()
    
    if total_links == 0:
        logger.info('[CheckDiscoveredPages] No pages to check')
        return {
            'status': 'success',
            'pages_checked': 0,
            'pages_ok': 0,
            'pages_error': 0
        }
    
    logger.info(f'[CheckDiscoveredPages] Checking {total_links} pages')
    
    pages_ok = 0
    pages_error = 0
    
    for link in links_to_check:
        try:
            # Perform status check
            check_result = check_site_status(link.url, timeout=10)
            
            # Create LinkCheck record
            link_check = LinkCheck.objects.create(
                link=link,
                status=check_result.get('status_code', 0),
                status_text='OK' if check_result['status'] == 'up' else check_result.get('error_message', 'Error'),
                response_time=check_result['response_time'],
                error_message=check_result.get('error_message', ''),
                metadata=check_result.get('metadata', {})
            )
            
            # Update DiscoveredLink
            link.current_status = check_result.get('status_code')
            link.current_status_text = link_check.status_text
            link.last_checked = timezone.now()
            link.save()
            
            if check_result['status'] == 'up':
                pages_ok += 1
            else:
                pages_error += 1
            
            logger.debug(f'[CheckDiscoveredPages] Checked {link.path}: {check_result.get("status_code", "N/A")}')
            
        except Exception as e:
            logger.error(f'[CheckDiscoveredPages] Error checking {link.url}: {str(e)}', exc_info=True)
            pages_error += 1
            # Update link with error
            try:
                link.current_status = None
                link.current_status_text = f'Check error: {str(e)}'
                link.last_checked = timezone.now()
                link.save()
            except Exception as save_error:
                logger.error(f'[CheckDiscoveredPages] Failed to save check result for {link.url}: {str(save_error)}')
    
    result = {
        'status': 'success',
        'pages_checked': total_links,
        'pages_ok': pages_ok,
        'pages_error': pages_error
    }
    
    logger.info(f'[CheckDiscoveredPages] Completed: {result}')
    return result


@shared_task(name='monitoring.tasks.aggregate_response_time_history')
def aggregate_response_time_history():
    """
    Aggregate StatusCheck records into ResponseTimeHistory for efficient chart queries.
    Runs daily at 2 AM via Celery Beat.
    """
    logger.info('[AggregateResponseTimeHistory] Starting aggregation')
    
    from django.db.models import Avg, Min, Max, Count, Percentile
    
    # Get yesterday's date
    yesterday = timezone.now().date() - timedelta(days=1)
    
    # Get all monitored sites
    sites = MonitoredSite.objects.all()
    
    aggregated_count = 0
    
    for site in sites:
        try:
            # Get all checks for yesterday
            checks = StatusCheck.objects.filter(
                site=site,
                checked_at__date=yesterday
            )
            
            if not checks.exists():
                continue
            
            # Calculate hourly aggregates
            from django.db.models.functions import TruncHour
            
            hourly_data = checks.annotate(
                hour=TruncHour('checked_at')
            ).values('hour').annotate(
                avg_response_time=Avg('response_time'),
                min_response_time=Min('response_time'),
                max_response_time=Max('response_time'),
                check_count=Count('id')
            )
            
            for hour_data in hourly_data:
                hour = hour_data['hour'].hour if hasattr(hour_data['hour'], 'hour') else None
                
                # Calculate percentiles (approximate)
                hour_checks = checks.filter(
                    checked_at__hour=hour
                ).values_list('response_time', flat=True)
                
                sorted_times = sorted(hour_checks)
                count = len(sorted_times)
                
                if count > 0:
                    p50_index = int(count * 0.5)
                    p95_index = int(count * 0.95)
                    p99_index = int(count * 0.99) if count > 1 else 0
                    
                    p50 = sorted_times[p50_index] if p50_index < count else sorted_times[-1]
                    p95 = sorted_times[p95_index] if p95_index < count else sorted_times[-1]
                    p99 = sorted_times[p99_index] if p99_index < count else sorted_times[-1]
                    
                    # Create or update ResponseTimeHistory record
                    ResponseTimeHistory.objects.update_or_create(
                        site=site,
                        date=yesterday,
                        hour=hour,
                        defaults={
                            'p50': float(p50),
                            'p95': float(p95),
                            'p99': float(p99) if p99_index < count else None,
                            'avg': float(hour_data['avg_response_time']),
                            'min_response_time': int(hour_data['min_response_time']),
                            'max_response_time': int(hour_data['max_response_time']),
                            'check_count': hour_data['check_count']
                        }
                    )
                    aggregated_count += 1
            
            # Also create daily aggregate (hour=None)
            daily_avg = checks.aggregate(
                avg_response_time=Avg('response_time'),
                min_response_time=Min('response_time'),
                max_response_time=Max('response_time'),
                check_count=Count('id')
            )
            
            if daily_avg['check_count'] > 0:
                sorted_daily = sorted(checks.values_list('response_time', flat=True))
                count = len(sorted_daily)
                p50_index = int(count * 0.5)
                p95_index = int(count * 0.95)
                p99_index = int(count * 0.99) if count > 1 else 0
                
                p50 = sorted_daily[p50_index] if p50_index < count else sorted_daily[-1]
                p95 = sorted_daily[p95_index] if p95_index < count else sorted_daily[-1]
                p99 = sorted_daily[p99_index] if p99_index < count else sorted_daily[-1]
                
                ResponseTimeHistory.objects.update_or_create(
                    site=site,
                    date=yesterday,
                    hour=None,
                    defaults={
                        'p50': float(p50),
                        'p95': float(p95),
                        'p99': float(p99) if p99_index < count else None,
                        'avg': float(daily_avg['avg_response_time']),
                        'min_response_time': int(daily_avg['min_response_time']),
                        'max_response_time': int(daily_avg['max_response_time']),
                        'check_count': daily_avg['check_count']
                    }
                )
                aggregated_count += 1
            
        except Exception as e:
            logger.error(f'[AggregateResponseTimeHistory] Error aggregating for {site.url}: {str(e)}', exc_info=True)
    
    result = {
        'status': 'success',
        'aggregated_records': aggregated_count,
        'date': yesterday.isoformat()
    }
    
    logger.info(f'[AggregateResponseTimeHistory] Completed: {result}')
    return result


@shared_task(name='monitoring.tasks.cleanup_monitoring_data')
def cleanup_monitoring_data():
    """
    Clean up old monitoring data (older than 30 days).
    Runs daily at 3 AM via Celery Beat.
    """
    logger.info('[CleanupMonitoringData] Starting cleanup')
    
    cutoff_date = timezone.now() - timedelta(days=30)
    
    # Delete old StatusCheck records
    deleted_checks = StatusCheck.objects.filter(checked_at__lt=cutoff_date).delete()[0]
    logger.info(f'[CleanupMonitoringData] Deleted {deleted_checks} old StatusCheck records')
    
    # Delete old LinkCheck records
    deleted_link_checks = LinkCheck.objects.filter(checked_at__lt=cutoff_date).delete()[0]
    logger.info(f'[CleanupMonitoringData] Deleted {deleted_link_checks} old LinkCheck records')
    
    # Resolve old ongoing incidents (older than 7 days)
    old_cutoff = timezone.now() - timedelta(days=7)
    resolved_incidents = Incident.objects.filter(
        status='ongoing',
        started_at__lt=old_cutoff
    ).update(
        status='resolved',
        resolved_at=timezone.now()
    )
    logger.info(f'[CleanupMonitoringData] Resolved {resolved_incidents} old ongoing incidents')
    
    result = {
        'status': 'success',
        'deleted_checks': deleted_checks,
        'deleted_link_checks': deleted_link_checks,
        'resolved_incidents': resolved_incidents
    }
    
    logger.info(f'[CleanupMonitoringData] Completed: {result}')
    return result

