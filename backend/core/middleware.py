"""
Custom middleware for request/response logging and performance monitoring
"""
import time
import logging
import json
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

# Get loggers
request_logger = logging.getLogger('pagerodeo.requests')
performance_logger = logging.getLogger('pagerodeo.performance')

# PostHog integration for alerting
try:
    from core.posthog_config import capture_event
except ImportError:
    capture_event = lambda *args, **kwargs: None


class RequestResponseLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all HTTP requests and responses
    """
    
    def process_request(self, request):
        """Log incoming request"""
        request.start_time = time.time()
        request.request_id = str(int(time.time() * 1000))
        
        # Log request details
        request_data = {
            'request_id': request.request_id,
            'method': request.method,
            'path': request.path,
            'query_string': request.META.get('QUERY_STRING', ''),
            'remote_addr': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'content_type': request.META.get('CONTENT_TYPE', ''),
        }
        
        # Log authenticated user if available
        if hasattr(request, 'user') and request.user.is_authenticated:
            request_data['user'] = request.user.username
            request_data['user_id'] = request.user.id
        
        request_logger.info(f'Request: {json.dumps(request_data)}')
    
    def process_response(self, request, response):
        """Log outgoing response"""
        if not hasattr(request, 'start_time'):
            return response
        
        duration = time.time() - request.start_time
        
        response_data = {
            'request_id': getattr(request, 'request_id', 'unknown'),
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2),
            'content_length': len(response.content) if hasattr(response, 'content') else 0,
        }
        
        # Log authenticated user if available
        if hasattr(request, 'user') and request.user.is_authenticated:
            response_data['user'] = request.user.username
        
        request_logger.info(f'Response: {json.dumps(response_data)}')
        
        # Log slow requests (more than 1 second)
        if duration > 1.0:
            performance_logger.warning(
                f'Slow request detected: {request.path} took {duration:.2f}s',
                extra={
                    'request_id': getattr(request, 'request_id', 'unknown'),
                    'duration': duration,
                    'path': request.path,
                    'method': request.method,
                }
            )
        
        # Alert on server errors (5xx)
        if response.status_code >= 500:
            error_data = {
                'request_id': getattr(request, 'request_id', 'unknown'),
                'status_code': response.status_code,
                'path': request.path,
                'method': request.method,
                'duration_ms': round(duration * 1000, 2),
            }
            
            # Send alert to PostHog
            capture_event(
                distinct_id='system',
                event='server_error',
                properties={
                    'error_type': 'http_5xx',
                    'status_code': response.status_code,
                    'path': request.path,
                    'method': request.method,
                    'duration_ms': round(duration * 1000, 2),
                    **error_data,
                }
            )
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """
    Middleware for application performance monitoring (APM)
    Tracks response times, database queries, and performance metrics
    """
    
    def process_request(self, request):
        """Initialize performance tracking"""
        request.performance_data = {
            'start_time': time.time(),
            'db_queries_start': len(settings.DEBUG and [] or []),  # Would need Django Debug Toolbar or similar
        }
    
    def process_response(self, request, response):
        """Log performance metrics"""
        if not hasattr(request, 'performance_data'):
            return response
        
        duration = time.time() - request.performance_data['start_time']
        
        # Log performance metrics
        performance_data = {
            'request_id': getattr(request, 'request_id', 'unknown'),
            'path': request.path,
            'method': request.method,
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2),
            'timestamp': time.time(),
        }
        
        performance_logger.info(f'Performance: {json.dumps(performance_data)}')
        
        # Track performance metrics in PostHog
        if duration > 0.5:  # Log slow requests (> 500ms)
            capture_event(
                distinct_id='system',
                event='slow_request',
                properties={
                    'duration_ms': round(duration * 1000, 2),
                    'path': request.path,
                    'method': request.method,
                    'status_code': response.status_code,
                }
            )
        
        return response

