"""
Centralized logging configuration for Django
Includes structured logging, file rotation, and retention policies
"""
import os
import logging
import logging.handlers
from pathlib import Path

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Create logs directory if it doesn't exist
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# Log retention settings
LOG_RETENTION_DAYS = 30  # Keep logs for 30 days
LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB per log file
LOG_BACKUP_COUNT = 10  # Keep 10 backup files (10MB * 10 = 100MB total per log type)

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        # JSON formatter (optional - requires python-json-logger)
        # 'json': {
        #     '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
        #     'format': '%(asctime)s %(name)s %(levelname)s %(message)s %(pathname)s %(lineno)d',
        # },
    },
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        # Console handler for development
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'filters': ['require_debug_true'],
        },
        # File handler for application logs
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'app.log',
            'maxBytes': LOG_MAX_BYTES,
            'backupCount': LOG_BACKUP_COUNT,
            'formatter': 'verbose',
        },
        # File handler for error logs
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'error.log',
            'maxBytes': LOG_MAX_BYTES,
            'backupCount': LOG_BACKUP_COUNT,
            'formatter': 'verbose',
        },
        # File handler for request/response logs
        'request_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'requests.log',
            'maxBytes': LOG_MAX_BYTES,
            'backupCount': LOG_BACKUP_COUNT,
            'formatter': 'verbose',
        },
        # File handler for background job logs
        'job_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'jobs.log',
            'maxBytes': LOG_MAX_BYTES,
            'backupCount': LOG_BACKUP_COUNT,
            'formatter': 'verbose',
        },
        # File handler for performance logs
        'performance_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'performance.log',
            'maxBytes': LOG_MAX_BYTES,
            'backupCount': LOG_BACKUP_COUNT,
            'formatter': 'verbose',
        },
        # Mail handler for critical errors (optional)
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'formatter': 'verbose',
            'filters': ['require_debug_false'],
        },
    },
    'loggers': {
        # Django framework logger
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        # Django request logger
        'django.request': {
            'handlers': ['error_file', 'mail_admins'],
            'level': 'ERROR',
            'propagate': False,
        },
        # Application logger
        'pagerodeo': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
        # Request/response logger
        'pagerodeo.requests': {
            'handlers': ['request_file'],
            'level': 'INFO',
            'propagate': False,
        },
        # Background job logger
        'pagerodeo.jobs': {
            'handlers': ['job_file', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
        # Performance logger
        'pagerodeo.performance': {
            'handlers': ['performance_file'],
            'level': 'INFO',
            'propagate': False,
        },
        # Theme/palette logger
        'pagerodeo.theme': {
            'handlers': ['file', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'WARNING',
    },
}

# Log cleanup function (to be called periodically)
def cleanup_old_logs():
    """
    Remove log files older than LOG_RETENTION_DAYS
    This should be called periodically (e.g., via cron or scheduled task)
    """
    import time
    
    cutoff_time = time.time() - (LOG_RETENTION_DAYS * 24 * 60 * 60)
    
    deleted_count = 0
    for log_file in LOGS_DIR.glob('*.log*'):
        try:
            if log_file.stat().st_mtime < cutoff_time:
                log_file.unlink()
                deleted_count += 1
        except Exception as e:
            # Use basic logging if logger not available
            try:
                logger = logging.getLogger('pagerodeo')
                logger.error(f'Failed to delete old log file {log_file}: {e}')
            except:
                print(f'Failed to delete old log file {log_file}: {e}')
    
    if deleted_count > 0:
        try:
            logger = logging.getLogger('pagerodeo')
            logger.info(f'Cleaned up {deleted_count} old log files')
        except:
            print(f'Cleaned up {deleted_count} old log files')

