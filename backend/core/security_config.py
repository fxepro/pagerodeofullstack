"""
Security configuration for Django
Includes HTTPS enforcement, HSTS, CSP, secure cookies, and security headers
"""
import os
from pathlib import Path

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Try to use python-decouple for environment variables
# Fallback to os.environ if not available
try:
    from decouple import config, Csv
    USE_DECOUPLE = True
except ImportError:
    USE_DECOUPLE = False
    # Fallback function for os.environ
    def config(key, default=None):
        return os.environ.get(key, default)
    def Csv(value, cast=None):
        if value is None:
            return []
        return [v.strip() for v in value.split(',') if v.strip()]


# Environment variable loading
def get_env_bool(key, default=False):
    """Get boolean environment variable"""
    if USE_DECOUPLE:
        return config(key, default=default, cast=bool)
    value = config(key, default=str(default))
    return value.lower() in ('true', '1', 'yes', 'on')


def get_env_int(key, default=0):
    """Get integer environment variable"""
    if USE_DECOUPLE:
        return config(key, default=default, cast=int)
    value = config(key, default=str(default))
    try:
        return int(value)
    except ValueError:
        return default


def get_env_list(key, default=None):
    """Get list environment variable (comma-separated)"""
    if USE_DECOUPLE:
        result = config(key, default=default or [], cast=Csv)
        # Ensure we return a list, not a Csv object
        if hasattr(result, '__iter__') and not isinstance(result, (str, bytes)):
            return list(result)
        return result if isinstance(result, list) else (default or [])
    value = config(key, default='')
    if not value:
        return default or []
    return [v.strip() for v in value.split(',') if v.strip()]


# Security Settings
# These are applied in settings.py after importing this module
# Note: DEBUG must be read from environment with same default as settings.py
# settings.py uses default=True (development mode), so we use the same default here

# Read DEBUG from environment (same default as settings.py: True for development)
# This ensures security_config uses the same DEBUG value as settings.py
_DEBUG = get_env_bool('DEBUG', default=True)

# Security settings that depend on DEBUG
# Allow override via environment variable, but default based on DEBUG
SECURE_SSL_REDIRECT = get_env_bool('SECURE_SSL_REDIRECT', default=not _DEBUG)
SECURE_HSTS_SECONDS = get_env_int('SECURE_HSTS_SECONDS', default=31536000 if not _DEBUG else 0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = get_env_bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=not _DEBUG)
SECURE_HSTS_PRELOAD = get_env_bool('SECURE_HSTS_PRELOAD', default=not _DEBUG)

# Content Security Policy (CSP)
# CSP is configured via django-csp middleware if installed
CSP_DEFAULT_SRC = get_env_list('CSP_DEFAULT_SRC', default=["'self'"])
CSP_SCRIPT_SRC = get_env_list('CSP_SCRIPT_SRC', default=["'self'", "'unsafe-inline'", "'unsafe-eval'"])
CSP_STYLE_SRC = get_env_list('CSP_STYLE_SRC', default=["'self'", "'unsafe-inline'"])
CSP_IMG_SRC = get_env_list('CSP_IMG_SRC', default=["'self'", 'data:', 'https:'])
CSP_FONT_SRC = get_env_list('CSP_FONT_SRC', default=["'self'", 'data:'])
CSP_CONNECT_SRC = get_env_list('CSP_CONNECT_SRC', default=["'self'"])
CSP_FRAME_SRC = get_env_list('CSP_FRAME_SRC', default=["'self'"])

# Secure cookies
SESSION_COOKIE_SECURE = get_env_bool('SESSION_COOKIE_SECURE', default=not _DEBUG)
SESSION_COOKIE_HTTPONLY = get_env_bool('SESSION_COOKIE_HTTPONLY', default=True)
SESSION_COOKIE_SAMESITE = config('SESSION_COOKIE_SAMESITE', default='Lax')
CSRF_COOKIE_SECURE = get_env_bool('CSRF_COOKIE_SECURE', default=not _DEBUG)
CSRF_COOKIE_HTTPONLY = get_env_bool('CSRF_COOKIE_HTTPONLY', default=True)
CSRF_COOKIE_SAMESITE = config('CSRF_COOKIE_SAMESITE', default='Lax')

# Security headers
SECURE_CONTENT_TYPE_NOSNIFF = get_env_bool('SECURE_CONTENT_TYPE_NOSNIFF', default=True)
SECURE_BROWSER_XSS_FILTER = get_env_bool('SECURE_BROWSER_XSS_FILTER', default=True)
X_FRAME_OPTIONS = config('X_FRAME_OPTIONS', default='DENY')
SECURE_REFERRER_POLICY = config('SECURE_REFERRER_POLICY', default='strict-origin-when-cross-origin')

# Additional security settings
SECURE_PROXY_SSL_HEADER = get_env_list('SECURE_PROXY_SSL_HEADER', default=['HTTP_X_FORWARDED_PROTO', 'https'])
USE_TZ = True  # Always use timezone-aware datetimes

# Rate limiting settings
RATE_LIMIT_ENABLE = get_env_bool('RATE_LIMIT_ENABLE', default=True)
RATE_LIMIT_PER_MINUTE = get_env_int('RATE_LIMIT_PER_MINUTE', default=60)
RATE_LIMIT_PER_HOUR = get_env_int('RATE_LIMIT_PER_HOUR', default=1000)

# Log security warnings
if _DEBUG:
    import warnings
    warnings.filterwarnings(
        'always',
        message='.*SECURE_SSL_REDIRECT.*',
        category=UserWarning
    )

