"""
Rate limiting utilities for Django views
Uses django-ratelimit for rate limiting
"""
from functools import wraps
from django.conf import settings
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status

# Try to import django-ratelimit
try:
    from django_ratelimit.decorators import ratelimit
    RATELIMIT_AVAILABLE = True
except ImportError:
    RATELIMIT_AVAILABLE = False
    # Fallback decorator that does nothing
    def ratelimit(*args, **kwargs):
        def decorator(func):
            return func
        return decorator


def get_rate_limit_settings():
    """Get rate limit settings from Django settings"""
    return {
        'enable': getattr(settings, 'RATE_LIMIT_ENABLE', True),
        'per_minute': getattr(settings, 'RATE_LIMIT_PER_MINUTE', 60),
        'per_hour': getattr(settings, 'RATE_LIMIT_PER_HOUR', 1000),
    }


def rate_limit_view(method='POST', rate='60/m', key='ip', block=True):
    """
    Rate limit decorator for Django views
    
    Args:
        method: HTTP method to rate limit (default: 'POST')
        rate: Rate limit string (e.g., '60/m' for 60 per minute, '1000/h' for 1000 per hour)
        key: Rate limit key ('ip' for IP address, 'user' for user, 'post' for POST data)
        block: Whether to block requests that exceed the rate limit (default: True)
    
    Returns:
        Decorated view function
    """
    if not RATELIMIT_AVAILABLE:
        # If django-ratelimit is not available, return a no-op decorator
        def decorator(func):
            return func
        return decorator
    
    if not get_rate_limit_settings()['enable']:
        # If rate limiting is disabled, return a no-op decorator
        def decorator(func):
            return func
        return decorator
    
    return ratelimit(method=method, rate=rate, key=key, block=block)


def rate_limit_api_view(method='POST', rate='60/m', key='ip'):
    """
    Rate limit decorator for Django REST Framework API views
    Returns a 429 Too Many Requests response if rate limit is exceeded
    
    Args:
        method: HTTP method to rate limit (default: 'POST')
        rate: Rate limit string (e.g., '60/m' for 60 per minute)
        key: Rate limit key ('ip' for IP address, 'user' for user)
    
    Returns:
        Decorator function
    """
    def decorator(func):
        if not RATELIMIT_AVAILABLE:
            # If django-ratelimit is not available, return function as-is
            return func
        
        if not get_rate_limit_settings()['enable']:
            # If rate limiting is disabled, return function as-is
            return func
        
        # Use django-ratelimit with custom handling for DRF views
        @wraps(func)
        @ratelimit(method=method, rate=rate, key=key, block=False)
        def wrapper(request, *args, **kwargs):
            # Check if request was rate limited
            if getattr(request, 'limited', False):
                return Response(
                    {'error': 'Rate limit exceeded. Please try again later.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


# Common rate limit decorators
rate_limit_login = rate_limit_api_view(method='POST', rate='5/m', key='ip')  # 5 login attempts per minute
rate_limit_register = rate_limit_api_view(method='POST', rate='3/h', key='ip')  # 3 registrations per hour
rate_limit_api = rate_limit_api_view(method='POST', rate='60/m', key='ip')  # 60 API calls per minute
rate_limit_api_authenticated = rate_limit_api_view(method='POST', rate='1000/h', key='user')  # 1000 API calls per hour per user

