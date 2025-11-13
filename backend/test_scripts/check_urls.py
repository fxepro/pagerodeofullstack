import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver

print("="*70)
print("ALL REGISTERED URLs IN DJANGO")
print("="*70)

def show_urls(urlpatterns, prefix=''):
    for pattern in urlpatterns:
        if isinstance(pattern, URLResolver):
            # It's a URL resolver (includes another URLconf)
            show_urls(pattern.url_patterns, prefix + str(pattern.pattern))
        elif isinstance(pattern, URLPattern):
            # It's a URL pattern
            full_path = prefix + str(pattern.pattern)
            view_name = pattern.name or 'No name'
            print(f"{full_path:50} -> {view_name}")

resolver = get_resolver()
show_urls(resolver.url_patterns)

print("\n" + "="*70)
print("CHECKING SPECIFIC ENDPOINTS")
print("="*70)

endpoints_to_check = [
    '/api/token/',
    '/api/user-info/',
    '/api/register/',
    '/api/users/',
    '/api/palettes/active/',
]

for endpoint in endpoints_to_check:
    try:
        match = resolver.resolve(endpoint)
        print(f"✓ {endpoint:35} -> Found: {match.func.__name__}")
    except:
        print(f"✗ {endpoint:35} -> NOT FOUND (404)")

print("\n" + "="*70)


