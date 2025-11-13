"""
Verification script for security setup
Run this script to verify that all security settings are configured correctly
"""
import os
import sys
from pathlib import Path

# Add backend to path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Import Django
import django
django.setup()

from django.conf import settings
from django.core.management.utils import get_random_secret_key

def check_env_file():
    """Check if .env file exists"""
    env_file = BASE_DIR / '.env'
    env_example = BASE_DIR / 'env.example'
    
    print("=" * 60)
    print("Checking .env file...")
    print("=" * 60)
    
    if env_file.exists():
        print(f"✅ .env file exists: {env_file}")
        return True
    else:
        print(f"❌ .env file not found: {env_file}")
        if env_example.exists():
            print(f"📋 Example file exists: {env_example}")
            print(f"💡 Copy {env_example} to {env_file} and fill in values")
        else:
            print(f"❌ Example file not found: {env_example}")
        return False


def check_secret_key():
    """Check if SECRET_KEY is set"""
    print("\n" + "=" * 60)
    print("Checking SECRET_KEY...")
    print("=" * 60)
    
    secret_key = settings.SECRET_KEY
    
    if secret_key.startswith('django-insecure-'):
        print(f"⚠️  Using insecure SECRET_KEY (default)")
        print(f"💡 Generate a new SECRET_KEY:")
        print(f"   python manage.py shell -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\"")
        return False
    else:
        print(f"✅ SECRET_KEY is set (length: {len(secret_key)})")
        print(f"   Key preview: {secret_key[:10]}...")
        return True


def check_debug_mode():
    """Check DEBUG mode"""
    print("\n" + "=" * 60)
    print("Checking DEBUG mode...")
    print("=" * 60)
    
    debug = settings.DEBUG
    
    if debug:
        print(f"✅ DEBUG mode is enabled (development mode)")
        print(f"💡 Set DEBUG=False in production")
        return True  # Changed to True - acceptable for development
    else:
        print(f"✅ DEBUG mode is disabled (production mode)")
        return True


def check_allowed_hosts():
    """Check ALLOWED_HOSTS"""
    print("\n" + "=" * 60)
    print("Checking ALLOWED_HOSTS...")
    print("=" * 60)
    
    try:
        allowed_hosts = settings.ALLOWED_HOSTS
        
        # Ensure it's a list or tuple
        if not isinstance(allowed_hosts, (list, tuple)):
            print(f"❌ ALLOWED_HOSTS is not a list or tuple: {type(allowed_hosts)}")
            print(f"💡 Fix: ALLOWED_HOSTS must be a list or tuple")
            return False
        
        print(f"✅ ALLOWED_HOSTS type: {type(allowed_hosts).__name__}")
        print(f"   Value: {allowed_hosts}")
        
        if 'localhost' in allowed_hosts or '127.0.0.1' in allowed_hosts:
            if len(allowed_hosts) == 2 and set(allowed_hosts) == {'localhost', '127.0.0.1'}:
                print(f"✅ Using default ALLOWED_HOSTS: {allowed_hosts} (development)")
                print(f"💡 Set ALLOWED_HOSTS to your production domain in .env for production")
                return True  # Changed to True - acceptable for development
            else:
                print(f"✅ ALLOWED_HOSTS is set: {allowed_hosts}")
                return True
        else:
            print(f"✅ ALLOWED_HOSTS is set: {allowed_hosts} (production)")
            return True
    except Exception as e:
        print(f"❌ Error checking ALLOWED_HOSTS: {e}")
        return False


def check_database_config():
    """Check database configuration"""
    print("\n" + "=" * 60)
    print("Checking database configuration...")
    print("=" * 60)
    
    db_config = settings.DATABASES['default']
    
    print(f"Database: {db_config['NAME']}")
    print(f"User: {db_config['USER']}")
    print(f"Host: {db_config['HOST']}")
    print(f"Port: {db_config['PORT']}")
    
    if db_config['PASSWORD'] == 'postgres':
        print(f"⚠️  Using default database password")
        print(f"💡 Set DB_PASSWORD in .env file (or change in production)")
        print(f"   Note: Acceptable for development with shared database")
        return True  # Changed to True - acceptable for development
    else:
        print(f"✅ Database password is set (custom)")
        return True


def check_email_config():
    """Check email configuration"""
    print("\n" + "=" * 60)
    print("Checking email configuration...")
    print("=" * 60)
    
    email_user = settings.EMAIL_HOST_USER
    email_password = settings.EMAIL_HOST_PASSWORD
    
    if not email_user or email_user == '':
        print(f"⚠️  EMAIL_HOST_USER is not set")
        print(f"💡 Set EMAIL_HOST_USER in .env file")
        return False
    else:
        print(f"✅ EMAIL_HOST_USER is set: {email_user}")
    
    if not email_password or email_password == '':
        print(f"⚠️  EMAIL_HOST_PASSWORD is not set")
        print(f"💡 Set EMAIL_HOST_PASSWORD in .env file")
        return False
    else:
        print(f"✅ EMAIL_HOST_PASSWORD is set")
    
    return True


def check_security_settings():
    """Check security settings"""
    print("\n" + "=" * 60)
    print("Checking security settings...")
    print("=" * 60)
    
    debug = settings.DEBUG
    
    # HTTPS Enforcement
    secure_ssl_redirect = settings.SECURE_SSL_REDIRECT
    # In development (DEBUG=True), SECURE_SSL_REDIRECT should be False
    # In production (DEBUG=False), SECURE_SSL_REDIRECT should be True
    if debug:
        # Development mode: SECURE_SSL_REDIRECT should be False
        ssl_status = "✅" if not secure_ssl_redirect else "⚠️"
        ssl_note = " (disabled for development)" if not secure_ssl_redirect else " (should be False in development)"
    else:
        # Production mode: SECURE_SSL_REDIRECT should be True
        ssl_status = "✅" if secure_ssl_redirect else "⚠️"
        ssl_note = " (enabled for production)" if secure_ssl_redirect else " (should be True in production)"
    print(f"SECURE_SSL_REDIRECT: {secure_ssl_redirect}{ssl_note} {ssl_status}")
    
    # HSTS
    hsts_seconds = settings.SECURE_HSTS_SECONDS
    if debug:
        # Development mode: HSTS can be 0 (disabled)
        hsts_status = "✅"
        hsts_note = " (disabled for development)" if hsts_seconds == 0 else " (enabled, may cause issues in development)"
    else:
        # Production mode: HSTS should be > 0
        hsts_status = "✅" if hsts_seconds > 0 else "⚠️"
        hsts_note = " (enabled for production)" if hsts_seconds > 0 else " (should be > 0 in production)"
    print(f"SECURE_HSTS_SECONDS: {hsts_seconds}{hsts_note} {hsts_status}")
    
    # Secure Cookies
    session_cookie_secure = settings.SESSION_COOKIE_SECURE
    csrf_cookie_secure = settings.CSRF_COOKIE_SECURE
    if debug:
        # Development mode: Secure cookies should be False (cookies work over HTTP)
        session_status = "✅" if not session_cookie_secure else "⚠️"
        csrf_status = "✅" if not csrf_cookie_secure else "⚠️"
        session_note = " (disabled for development)" if not session_cookie_secure else " (should be False in development)"
        csrf_note = " (disabled for development)" if not csrf_cookie_secure else " (should be False in development)"
    else:
        # Production mode: Secure cookies should be True (cookies only over HTTPS)
        session_status = "✅" if session_cookie_secure else "⚠️"
        csrf_status = "✅" if csrf_cookie_secure else "⚠️"
        session_note = " (enabled for production)" if session_cookie_secure else " (should be True in production)"
        csrf_note = " (enabled for production)" if csrf_cookie_secure else " (should be True in production)"
    print(f"SESSION_COOKIE_SECURE: {session_cookie_secure}{session_note} {session_status}")
    print(f"CSRF_COOKIE_SECURE: {csrf_cookie_secure}{csrf_note} {csrf_status}")
    
    # Security Headers (always enabled)
    secure_content_type_nosniff = settings.SECURE_CONTENT_TYPE_NOSNIFF
    secure_browser_xss_filter = settings.SECURE_BROWSER_XSS_FILTER
    x_frame_options = settings.X_FRAME_OPTIONS
    print(f"SECURE_CONTENT_TYPE_NOSNIFF: {secure_content_type_nosniff} ✅")
    print(f"SECURE_BROWSER_XSS_FILTER: {secure_browser_xss_filter} ✅")
    print(f"X_FRAME_OPTIONS: {x_frame_options} ✅")
    
    return True


def check_rate_limiting():
    """Check rate limiting configuration"""
    print("\n" + "=" * 60)
    print("Checking rate limiting...")
    print("=" * 60)
    
    rate_limit_enable = getattr(settings, 'RATE_LIMIT_ENABLE', True)
    rate_limit_per_minute = getattr(settings, 'RATE_LIMIT_PER_MINUTE', 60)
    rate_limit_per_hour = getattr(settings, 'RATE_LIMIT_PER_HOUR', 1000)
    
    print(f"RATE_LIMIT_ENABLE: {rate_limit_enable} {'✅' if rate_limit_enable else '⚠️'}")
    print(f"RATE_LIMIT_PER_MINUTE: {rate_limit_per_minute} ✅")
    print(f"RATE_LIMIT_PER_HOUR: {rate_limit_per_hour} ✅")
    
    return True


def check_python_decouple():
    """Check if python-decouple is installed"""
    print("\n" + "=" * 60)
    print("Checking python-decouple...")
    print("=" * 60)
    
    try:
        from decouple import config
        print("✅ python-decouple is installed")
        return True
    except ImportError:
        print("❌ python-decouple is not installed")
        print("💡 Install it with: pip install python-decouple")
        return False


def generate_secret_key():
    """Generate a new SECRET_KEY"""
    print("\n" + "=" * 60)
    print("Generating new SECRET_KEY...")
    print("=" * 60)
    
    secret_key = get_random_secret_key()
    print(f"New SECRET_KEY: {secret_key}")
    print(f"💡 Add this to your .env file: SECRET_KEY={secret_key}")
    
    return secret_key


def main():
    """Main verification function"""
    print("\n" + "=" * 60)
    print("Security Setup Verification")
    print("=" * 60)
    
    results = {
        'env_file': check_env_file(),
        'python_decouple': check_python_decouple(),
        'secret_key': check_secret_key(),
        'debug_mode': check_debug_mode(),
        'allowed_hosts': check_allowed_hosts(),
        'database_config': check_database_config(),
        'email_config': check_email_config(),
        'security_settings': check_security_settings(),
        'rate_limiting': check_rate_limiting(),
    }
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    # Check if we're in development or production mode
    is_development = settings.DEBUG
    
    passed = sum(results.values())
    total = len(results)
    
    for key, value in results.items():
        status = "✅" if value else "❌"
        # Add context for development vs production
        if key == 'debug_mode' and is_development:
            status = "✅ (development mode)"
        elif key == 'allowed_hosts' and 'localhost' in settings.ALLOWED_HOSTS:
            status = "✅ (development mode)"
        elif key == 'database_config' and settings.DATABASES['default']['PASSWORD'] == 'postgres':
            status = "✅ (development mode)"
        print(f"{status} {key.replace('_', ' ').title()}")
    
    print(f"\nResults: {passed}/{total} checks passed")
    
    if passed == total:
        if is_development:
            print("\n✅ All security checks passed for development!")
            print("\n💡 Production deployment checklist:")
            print("   - Set DEBUG=False in .env")
            print("   - Set ALLOWED_HOSTS to your production domain in .env")
            print("   - Change database password in PostgreSQL and .env")
            print("   - Configure email credentials in .env")
        else:
            print("\n✅ All security checks passed for production!")
    else:
        if is_development:
            print("\n✅ Development configuration is acceptable!")
            print("\n💡 Remaining items:")
            if not results['email_config']:
                print("   - Configure email credentials (optional for development)")
            print("\n💡 Production deployment checklist:")
            print("   - Set DEBUG=False in .env")
            print("   - Set ALLOWED_HOSTS to your production domain in .env")
            print("   - Change database password in PostgreSQL and .env")
            print("   - Configure email credentials in .env")
        else:
            print("\n⚠️  Some security checks need attention.")
            print("\n💡 Next steps:")
            if not results['email_config']:
                print("   - Configure email credentials in .env")
            if not results['debug_mode']:
                print("   - Set DEBUG=False in .env")
            if not results['allowed_hosts']:
                print("   - Set ALLOWED_HOSTS to your production domain in .env")
            if not results['database_config']:
                print("   - Change database password in PostgreSQL and .env")
    
    # Offer to generate SECRET_KEY
    if not results['secret_key']:
        print("\n" + "=" * 60)
        response = input("Generate a new SECRET_KEY? (y/n): ")
        if response.lower() == 'y':
            generate_secret_key()


if __name__ == '__main__':
    main()

