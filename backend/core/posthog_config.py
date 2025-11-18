"""
PostHog configuration for Django backend
"""
import os

# Try to use python-decouple if available, otherwise use os.environ
try:
    from decouple import config
    POSTHOG_API_KEY = config('POSTHOG_API_KEY', default='')
    POSTHOG_HOST = config('POSTHOG_HOST', default='https://app.posthog.com')
except ImportError:
    # Fallback to os.environ if decouple is not installed
    POSTHOG_API_KEY = os.environ.get('POSTHOG_API_KEY', '')
    POSTHOG_HOST = os.environ.get('POSTHOG_HOST', 'https://app.posthog.com')

# Initialize PostHog client
posthog_client = None

if POSTHOG_API_KEY:
    try:
        from posthog import Posthog
        posthog_client = Posthog(
            api_key=POSTHOG_API_KEY,
            host=POSTHOG_HOST
        )
        if os.environ.get('DEBUG', 'False') == 'True':
            print(f'[PostHog] Initialized with host: {POSTHOG_HOST}')
    except ImportError:
        if os.environ.get('DEBUG', 'False') == 'True':
            print('Warning: PostHog not installed. Run: pip install posthog')
        posthog_client = None
else:
    if os.environ.get('DEBUG', 'False') == 'True':
        print('Warning: POSTHOG_API_KEY not set. PostHog analytics will be disabled.')

def capture_event(distinct_id: str, event: str, properties: dict = None):
    """
    Capture an event in PostHog
    
    Args:
        distinct_id: Unique identifier for the user
        event: Event name
        properties: Event properties (optional)
    """
    if posthog_client:
        try:
            posthog_client.capture(
                distinct_id=distinct_id,
                event=event,
                properties=properties or {}
            )
        except Exception as e:
            # Don't break the app if PostHog fails
            print(f'PostHog capture failed: {e}')

def identify_user(distinct_id: str, properties: dict = None):
    """
    Identify a user in PostHog
    
    Args:
        distinct_id: Unique identifier for the user
        properties: User properties (optional)
    """
    if posthog_client:
        try:
            posthog_client.identify(
                distinct_id=distinct_id,
                properties=properties or {}
            )
        except Exception as e:
            # Don't break the app if PostHog fails
            print(f'PostHog identify failed: {e}')

