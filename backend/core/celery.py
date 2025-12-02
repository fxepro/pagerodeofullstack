"""
Celery configuration for background task processing.
"""

import os
import logging

logger = logging.getLogger('pagerodeo')

try:
    from celery import Celery
    from celery.schedules import crontab
    
    # Set default Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    
    app = Celery('pagerodeo')
    
    # Load configuration from Django settings
    # Don't connect to broker immediately - lazy connection
    app.config_from_object('django.conf:settings', namespace='CELERY')
    
    # Configure broker connection to be lazy (don't connect on startup)
    app.conf.broker_connection_retry_on_startup = False
    app.conf.broker_connection_retry = False
    
    # Auto-discover tasks from all installed apps
    # This might try to connect, so wrap in try/except
    try:
        app.autodiscover_tasks()
    except Exception as discover_error:
        logger.warning(f'Celery task discovery failed (Redis may not be running): {discover_error}')
        # Continue without task discovery - app can still run
    
except ImportError:
    # Celery not installed
    logger.warning('Celery not installed. Install with: pip install celery redis')
    app = None
except Exception as e:
    # Redis not running or other Celery setup error
    logger.warning(f'Celery setup failed (Redis may not be running): {e}')
    logger.warning('App will run without background tasks. Install Redis and start Celery for monitoring.')
    app = None

# Configure periodic tasks (Celery Beat)
# Only configure if app was successfully created
if app is not None:
    try:
        app.conf.beat_schedule = {
            # Check monitored sites every minute
            'check-monitored-sites': {
                'task': 'monitoring.tasks.check_monitored_sites',
                'schedule': 60.0,  # Every 60 seconds (1 minute)
            },
            # Check discovered pages every 15 minutes
            'check-discovered-pages': {
                'task': 'monitoring.tasks.check_discovered_pages',
                'schedule': 900.0,  # Every 900 seconds (15 minutes)
            },
            # Aggregate response time history daily at 2 AM
            'aggregate-response-time-history': {
                'task': 'monitoring.tasks.aggregate_response_time_history',
                'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
            },
            # Cleanup old monitoring data daily at 3 AM
            'cleanup-monitoring-data': {
                'task': 'monitoring.tasks.cleanup_monitoring_data',
                'schedule': crontab(hour=3, minute=0),  # Daily at 3 AM
            },
        }

        @app.task(bind=True)
        def debug_task(self):
            print(f'Request: {self.request!r}')
    except Exception as e:
        logger.warning(f'Failed to configure Celery beat schedule: {e}')
else:
    # Celery not available - create a dummy app to prevent import errors
    class DummyCelery:
        def task(self, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
        
        @property
        def conf(self):
            return type('obj', (object,), {'beat_schedule': {}})()
    
    app = DummyCelery()

