"""
Utility functions for monitoring site checks and incident detection.
"""

import time
import requests
from urllib.parse import urlparse
from django.utils import timezone
from django.db.models import Q
from monitoring.models import StatusCheck, Incident
from users.models import MonitoredSite


def normalize_url(url):
    """
    Normalize URL to ensure it has a protocol.
    
    Args:
        url: URL string (may or may not have protocol)
    
    Returns:
        Normalized URL with protocol
    """
    if not url:
        return None
    
    url = url.strip()
    
    # Add protocol if missing
    if not url.startswith(('http://', 'https://')):
        url = f'https://{url}'
    
    return url


def check_site_status(site_url, timeout=10):
    """
    Perform HTTP HEAD request to check site status.
    
    Args:
        site_url: URL to check
        timeout: Request timeout in seconds (default: 10)
    
    Returns:
        dict with keys:
            - status: 'up', 'down', or 'checking'
            - response_time: milliseconds
            - status_code: HTTP status code (if available)
            - error_message: Error description (if failed)
            - metadata: Additional info (headers, SSL, etc.)
    """
    normalized_url = normalize_url(site_url)
    if not normalized_url:
        return {
            'status': 'down',
            'response_time': 0,
            'status_code': None,
            'error_message': 'Invalid URL',
            'metadata': {}
        }
    
    start_time = time.time()
    metadata = {}
    
    try:
        # Perform HEAD request with timeout
        response = requests.head(
            normalized_url,
            timeout=timeout,
            allow_redirects=True,
            headers={
                'User-Agent': 'PageRodeo-Monitor/1.0'
            }
        )
        
        response_time_ms = int((time.time() - start_time) * 1000)
        status_code = response.status_code
        
        # Determine status based on HTTP status code
        if 200 <= status_code < 400:
            status = 'up'
            error_message = ''
        else:
            status = 'down'
            error_message = f'HTTP {status_code}'
        
        # Extract metadata
        metadata = {
            'server': response.headers.get('Server', ''),
            'content_type': response.headers.get('Content-Type', ''),
            'content_length': response.headers.get('Content-Length', ''),
        }
        
        # Check if HTTPS
        if normalized_url.startswith('https://'):
            metadata['ssl'] = True
            # Basic SSL validation (response succeeded = SSL is valid)
            metadata['ssl_valid'] = True
        else:
            metadata['ssl'] = False
            metadata['ssl_valid'] = None
        
        return {
            'status': status,
            'response_time': response_time_ms,
            'status_code': status_code,
            'error_message': error_message,
            'metadata': metadata
        }
        
    except requests.exceptions.Timeout:
        response_time_ms = int((time.time() - start_time) * 1000)
        return {
            'status': 'down',
            'response_time': response_time_ms,
            'status_code': None,
            'error_message': f'Request timeout after {timeout}s',
            'metadata': {'timeout': True}
        }
    
    except requests.exceptions.ConnectionError as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        error_msg = str(e)
        if 'Name or service not known' in error_msg or 'nodename nor servname provided' in error_msg:
            error_message = 'DNS resolution failed'
        elif 'Connection refused' in error_msg:
            error_message = 'Connection refused'
        else:
            error_message = f'Connection error: {error_msg}'
        
        return {
            'status': 'down',
            'response_time': response_time_ms,
            'status_code': None,
            'error_message': error_message,
            'metadata': {'connection_error': True}
        }
    
    except requests.exceptions.RequestException as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        return {
            'status': 'down',
            'response_time': response_time_ms,
            'status_code': None,
            'error_message': f'Request error: {str(e)}',
            'metadata': {'request_error': True}
        }
    
    except Exception as e:
        response_time_ms = int((time.time() - start_time) * 1000)
        return {
            'status': 'down',
            'response_time': response_time_ms,
            'status_code': None,
            'error_message': f'Unexpected error: {str(e)}',
            'metadata': {'unexpected_error': True}
        }


def detect_incident(site, current_status_check):
    """
    Detect and create/resolve incidents based on status transitions.
    
    Args:
        site: MonitoredSite instance
        current_status_check: StatusCheck instance (just created)
    
    Returns:
        Incident instance if created/resolved, None otherwise
    """
    # Get previous check for this site
    previous_check = StatusCheck.objects.filter(
        site=site
    ).exclude(id=current_status_check.id).order_by('-checked_at').first()
    
    if not previous_check:
        # First check for this site, no incident detection
        return None
    
    current_status = current_status_check.status
    previous_status = previous_check.status
    
    # Detect up → down transition (start incident)
    if previous_status == 'up' and current_status == 'down':
        # Check if there's already an ongoing incident
        ongoing_incident = Incident.objects.filter(
            site=site,
            status='ongoing'
        ).first()
        
        if not ongoing_incident:
            # Create new incident
            incident = Incident.objects.create(
                site=site,
                status='ongoing',
                started_at=current_status_check.checked_at,
                root_cause=current_status_check.error_message or 'Site is down',
                impact='full_outage',
                metadata={
                    'status_code': current_status_check.status_code,
                    'response_time': current_status_check.response_time,
                }
            )
            return incident
    
    # Detect down → up transition (resolve incident)
    elif previous_status == 'down' and current_status == 'up':
        # Find ongoing incident
        ongoing_incident = Incident.objects.filter(
            site=site,
            status='ongoing'
        ).first()
        
        if ongoing_incident:
            # Resolve incident
            resolved_at = current_status_check.checked_at
            duration_seconds = (resolved_at - ongoing_incident.started_at).total_seconds()
            duration_minutes = int(duration_seconds / 60)
            
            ongoing_incident.status = 'resolved'
            ongoing_incident.resolved_at = resolved_at
            ongoing_incident.duration_minutes = duration_minutes
            ongoing_incident.resolution_steps = 'Site recovered automatically'
            ongoing_incident.save()
            
            return ongoing_incident
    
    return None


def should_check_site(site):
    """
    Determine if a site should be checked based on its check_interval.
    
    Args:
        site: MonitoredSite instance
    
    Returns:
        bool: True if site should be checked, False otherwise
    """
    if not site.last_check:
        # Never checked before, should check
        return True
    
    # Calculate next check time
    from datetime import timedelta
    next_check_time = site.last_check + timedelta(minutes=site.check_interval)
    
    # Check if current time is past next check time
    return timezone.now() >= next_check_time


def get_sites_to_check():
    """
    Get all monitored sites that are due for checking.
    
    Returns:
        QuerySet of MonitoredSite instances that need checking
    """
    sites = MonitoredSite.objects.filter(
        # Only check active sites (not deleted)
    ).select_related('user')
    
    # Filter sites that are due for checking
    sites_to_check = [site for site in sites if should_check_site(site)]
    
    return sites_to_check

