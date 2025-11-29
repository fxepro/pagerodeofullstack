# Django will automatically discover admin.py in installed apps
# The admin URLs will be registered when Django starts

# Import Celery app to ensure it's loaded when Django starts
# Only import if Redis/Celery is available (graceful degradation for local dev)
try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except Exception as e:
    # Celery not available (Redis not running, etc.) - app can still run
    # Monitoring tasks won't run, but API endpoints and frontend will work
    import logging
    logger = logging.getLogger('pagerodeo')
    logger.warning(f'Celery not available (Redis may not be running): {e}')
    celery_app = None
    __all__ = ()

