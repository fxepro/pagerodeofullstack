"""
Utility functions for API monitoring
"""

import requests
import time
from urllib.parse import urlparse
from django.utils import timezone
from .models import APIEndpoint, APICheck, APIAlert


def extract_path_from_url(url: str) -> str:
    """
    Extract just the path from a full URL.
    Example: "http://localhost:8000/api/token/refresh/" -> "api/token/refresh/"
    """
    parsed = urlparse(url)
    path = parsed.path.strip('/')
    return path if path else url


def detect_context_from_url(url: str) -> str:
    """
    Auto-detect context/app/function from URL pattern.
    Returns a human-readable description.
    """
    path = extract_path_from_url(url).lower()
    
    # Authentication endpoints
    if '/token' in path or '/auth' in path or '/login' in path:
        if 'refresh' in path:
            return "Authentication - Refresh JWT token"
        elif 'login' in path:
            return "Authentication - User login"
        else:
            return "Authentication - Token management"
    
    # Analysis endpoints
    if '/analysis/' in path:
        if 'performance' in path:
            return "Analysis - Performance analysis"
        elif 'ssl' in path:
            return "Analysis - SSL certificate check"
        elif 'dns' in path:
            return "Analysis - DNS configuration"
        elif 'sitemap' in path:
            return "Analysis - Sitemap validation"
        elif 'api' in path:
            return "Analysis - API discovery"
        elif 'links' in path:
            return "Analysis - Link validation"
        elif 'typography' in path:
            return "Analysis - Typography check"
        else:
            return "Analysis - Website audit"
    
    # Reports endpoints
    if '/reports' in path:
        return "Reports - Audit report management"
    
    # Monitoring endpoints
    if '/monitor' in path or '/monitoring' in path:
        if 'sites' in path:
            return "Monitoring - Site status checks"
        elif 'uptime' in path:
            return "Monitoring - Uptime tracking"
        else:
            return "Monitoring - System health"
    
    # Admin tools
    if '/admin-tools' in path or '/admin/' in path:
        return "Admin - System administration"
    
    # Health/status endpoints
    if '/health' in path or '/status' in path or '/ping' in path:
        return "System - Health check"
    
    # Default: extract meaningful parts
    parts = path.split('/')
    if len(parts) >= 2:
        app = parts[0].title()
        function = parts[-1].replace('-', ' ').title() if parts[-1] else ""
        return f"{app} - {function}" if function else app
    
    return "API Endpoint"


def test_api_endpoint(endpoint: APIEndpoint) -> APICheck:
    """
    Test an API endpoint and save the result.
    
    Returns APICheck object with the result.
    """
    start_time = time.time()
    status_code = None
    response_body = None
    error_message = None
    is_success = False
    
    try:
        # Prepare headers
        headers = endpoint.headers.copy() if endpoint.headers else {}
        if endpoint.requires_auth and endpoint.auth_token:
            headers['Authorization'] = f'Bearer {endpoint.auth_token}'
        
        # Prepare request
        request_kwargs = {
            'method': endpoint.method,
            'url': endpoint.url,
            'headers': headers,
            'timeout': endpoint.timeout_seconds,
        }
        
        # Add body for POST/PUT/PATCH
        if endpoint.method in ['POST', 'PUT', 'PATCH'] and endpoint.body:
            request_kwargs['data'] = endpoint.body
            if not headers.get('Content-Type'):
                headers['Content-Type'] = 'application/json'
        
        # Make request
        response = requests.request(**request_kwargs)
        status_code = response.status_code
        response_time_ms = (time.time() - start_time) * 1000
        
        # Get response body (truncate if too long)
        try:
            response_body = response.text[:5000]  # Limit to 5000 chars
        except:
            response_body = None
        
        # Check if success
        is_success = (status_code == endpoint.expected_status_code)
        
    except requests.exceptions.Timeout:
        response_time_ms = endpoint.timeout_seconds * 1000
        error_message = f'Request timeout after {endpoint.timeout_seconds}s'
        is_success = False
    except requests.exceptions.ConnectionError:
        response_time_ms = (time.time() - start_time) * 1000
        error_message = 'Connection error - could not reach server'
        is_success = False
    except Exception as e:
        response_time_ms = (time.time() - start_time) * 1000
        error_message = str(e)
        is_success = False
    
    # Create check record
    check = APICheck.objects.create(
        endpoint=endpoint,
        status_code=status_code,
        response_time_ms=response_time_ms,
        is_success=is_success,
        response_body=response_body,
        error_message=error_message,
        checked_at=timezone.now()
    )
    
    # Create alert if failed
    if not is_success:
        alert_type = 'timeout' if 'timeout' in (error_message or '').lower() else 'down'
        if status_code and status_code != endpoint.expected_status_code:
            alert_type = 'unexpected_status'
        
        APIAlert.objects.create(
            endpoint=endpoint,
            api_check=check,
            alert_type=alert_type,
            message=error_message or f'Status {status_code} (expected {endpoint.expected_status_code})'
        )
    
    return check


def discover_api_endpoints(base_url: str) -> list:
    """
    Discover API endpoints from a base URL.
    Scans common API paths and returns list of potential endpoints.
    
    Returns list of dicts with 'url', 'method', 'status_code', 'found'
    """
    common_paths = [
        '/api/',
        '/api/v1/',
        '/api/v2/',
        '/api/health',
        '/api/status',
        '/api/ping',
        '/api/',
        '/health',
        '/status',
        '/ping',
        '/api/reports/',
        '/api/analysis/performance/',
        '/api/analysis/ssl/',
        '/api/analysis/dns/',
        '/api/analysis/sitemap/',
        '/api/analysis/api/',
        '/api/analysis/links/',
        '/api/analysis/typography/',
        '/api/monitor/sites/',
        '/api/token/',
        '/api/token/refresh/',
    ]
    
    discovered = []
    base_url = base_url.rstrip('/')
    
    # Ensure base_url has scheme (http/https)
    if not base_url.startswith(('http://', 'https://')):
        # Default to https in production, http for localhost
        if 'localhost' in base_url or '127.0.0.1' in base_url:
            base_url = f'http://{base_url}'
        else:
            base_url = f'https://{base_url}'
    
    for path in common_paths:
        url = f"{base_url}{path}"
        try:
            # Use verify=False for self-signed certs in dev, but should verify in production
            response = requests.get(url, timeout=5, allow_redirects=False, verify=True)
            discovered.append({
                'url': url,
                'method': 'GET',
                'status_code': response.status_code,
                'found': True
            })
        except requests.exceptions.SSLError:
            # Try without SSL verification (for dev environments)
            try:
                response = requests.get(url, timeout=5, allow_redirects=False, verify=False)
                discovered.append({
                    'url': url,
                    'method': 'GET',
                    'status_code': response.status_code,
                    'found': True
                })
            except requests.exceptions.RequestException:
                discovered.append({
                    'url': url,
                    'method': 'GET',
                    'status_code': None,
                    'found': False
                })
        except requests.exceptions.RequestException:
            discovered.append({
                'url': url,
                'method': 'GET',
                'status_code': None,
                'found': False
            })
    
    return discovered

