"""
Demo Account Utilities

Functions to manage demo accounts for each plan tier (Analyst, Auditor, Manager, Director, Executive).
Each plan has its own demo account with pre-loaded sample data.
"""

import secrets
import string
from django.contrib.auth.models import User
from django.conf import settings
from django.utils import timezone
from .models import UserProfile, MonitoredSite
import logging

logger = logging.getLogger(__name__)

# Demo account configuration
DEMO_PLANS = ['analyst', 'auditor', 'manager', 'director', 'executive']

DEMO_ACCOUNTS = {
    'analyst': {
        'username': 'analyst',
        'email': 'analyst@pagerodeo.com',
        'role': 'analyst',
        'first_name': 'Demo',
        'last_name': 'Analyst'
    },
    'auditor': {
        'username': 'auditor',
        'email': 'auditor@pagerodeo.com',
        'role': 'auditor',
        'first_name': 'Demo',
        'last_name': 'Auditor'
    },
    'manager': {
        'username': 'manager',
        'email': 'manager@pagerodeo.com',
        'role': 'manager',
        'first_name': 'Demo',
        'last_name': 'Manager'
    },
    'director': {
        'username': 'director',
        'email': 'director@pagerodeo.com',
        'role': 'director',
        'first_name': 'Demo',
        'last_name': 'Director'
    },
    'executive': {
        'username': 'executive',
        'email': 'executive@pagerodeo.com',
        'role': 'director',  # Executive uses director role
        'first_name': 'Demo',
        'last_name': 'Executive'
    },
}


def generate_secure_password(length=16):
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    # Remove ambiguous characters
    alphabet = alphabet.replace('0', '').replace('O', '').replace('l', '').replace('I', '')
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password


def get_or_create_demo_account(plan_name):
    """
    Get or create a demo account for the specified plan.
    
    Args:
        plan_name: One of 'analyst', 'auditor', 'manager', 'director', 'executive'
    
    Returns:
        tuple: (user, created) - Django User object and whether it was created
    """
    if plan_name not in DEMO_ACCOUNTS:
        raise ValueError(f"Invalid plan name: {plan_name}. Must be one of {DEMO_PLANS}")
    
    config = DEMO_ACCOUNTS[plan_name]
    
    # Get or create user
    user, created = User.objects.get_or_create(
        username=config['username'],
        defaults={
            'email': config['email'],
            'first_name': config['first_name'],
            'last_name': config['last_name'],
            'is_active': True,
        }
    )
    
    if created:
        logger.info(f"Created demo user: {config['username']}")
        # Set a temporary password (will be reset by setup command)
        user.set_password(generate_secure_password())
        user.save()
    else:
        # Update email if it changed
        if user.email != config['email']:
            user.email = config['email']
            user.save()
    
    # Get or create profile
    profile, profile_created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': config['role'],
            'is_active': True,
            'email_verified': True,  # Demo accounts don't need email verification
        }
    )
    
    if not profile_created:
        # Update role if it changed
        if profile.role != config['role']:
            profile.role = config['role']
            profile.save()
    
    return user, created


def reset_demo_password(plan_name):
    """
    Reset the password for a specific demo account.
    
    Args:
        plan_name: One of 'analyst', 'auditor', 'manager', 'director', 'executive'
    
    Returns:
        str: The new password
    """
    if plan_name not in DEMO_ACCOUNTS:
        raise ValueError(f"Invalid plan name: {plan_name}. Must be one of {DEMO_PLANS}")
    
    config = DEMO_ACCOUNTS[plan_name]
    
    try:
        user = User.objects.get(username=config['username'])
        new_password = generate_secure_password()
        user.set_password(new_password)
        user.save()
        logger.info(f"Reset password for demo account: {config['username']}")
        return new_password
    except User.DoesNotExist:
        # Account doesn't exist, create it
        user, _ = get_or_create_demo_account(plan_name)
        new_password = generate_secure_password()
        user.set_password(new_password)
        user.save()
        logger.info(f"Created and set password for demo account: {config['username']}")
        return new_password


def get_demo_credentials(plan_name):
    """
    Get current demo credentials for a plan.
    Note: This requires the password to be stored or retrieved from a secure location.
    Since Django stores hashed passwords, we can't retrieve the actual password.
    This function is mainly for getting username/email.
    
    Args:
        plan_name: One of 'analyst', 'auditor', 'manager', 'director', 'executive'
    
    Returns:
        dict: {'username': str, 'email': str}
    """
    if plan_name not in DEMO_ACCOUNTS:
        raise ValueError(f"Invalid plan name: {plan_name}. Must be one of {DEMO_PLANS}")
    
    config = DEMO_ACCOUNTS[plan_name]
    
    try:
        user = User.objects.get(username=config['username'])
        return {
            'username': user.username,
            'email': user.email,
            'exists': True
        }
    except User.DoesNotExist:
        return {
            'username': config['username'],
            'email': config['email'],
            'exists': False
        }


def reset_all_demo_passwords():
    """
    Reset passwords for all demo accounts.
    Used by scheduled task (cron job).
    
    Returns:
        dict: {plan_name: new_password} for all plans
    """
    passwords = {}
    for plan_name in DEMO_PLANS:
        try:
            password = reset_demo_password(plan_name)
            passwords[plan_name] = password
            logger.info(f"Reset password for {plan_name} demo account")
        except Exception as e:
            logger.error(f"Failed to reset password for {plan_name} demo account: {str(e)}")
            passwords[plan_name] = None
    
    return passwords


def create_demo_sample_data(plan_name):
    """
    Create sample monitoring data for a demo account.
    This is optional and can be called separately.
    
    Args:
        plan_name: One of 'analyst', 'auditor', 'manager', 'director', 'executive'
    """
    if plan_name not in DEMO_ACCOUNTS:
        raise ValueError(f"Invalid plan name: {plan_name}. Must be one of {DEMO_PLANS}")
    
    config = DEMO_ACCOUNTS[plan_name]
    
    try:
        user = User.objects.get(username=config['username'])
    except User.DoesNotExist:
        logger.warning(f"Demo account {config['username']} does not exist. Create it first.")
        return
    
    # Sample URLs to monitor (different for each tier)
    sample_urls = {
        'analyst': [
            'https://example.com',
            'https://demo-site-1.com',
        ],
        'auditor': [
            'https://example.com',
            'https://demo-site-1.com',
            'https://demo-site-2.com',
        ],
        'manager': [
            'https://example.com',
            'https://demo-site-1.com',
            'https://demo-site-2.com',
            'https://demo-site-3.com',
        ],
        'director': [
            'https://example.com',
            'https://demo-site-1.com',
            'https://demo-site-2.com',
            'https://demo-site-3.com',
            'https://demo-site-4.com',
        ],
        'executive': [
            'https://example.com',
            'https://demo-site-1.com',
            'https://demo-site-2.com',
            'https://demo-site-3.com',
            'https://demo-site-4.com',
            'https://demo-site-5.com',
        ],
    }
    
    urls = sample_urls.get(plan_name, sample_urls['analyst'])
    
    # Create MonitoredSite entries
    for url in urls:
        MonitoredSite.objects.get_or_create(
            user=user,
            url=url,
            defaults={
                'status': 'up',
                'uptime': 99.5,
                'check_interval': 5,
            }
        )
    
    logger.info(f"Created sample data for {plan_name} demo account")

