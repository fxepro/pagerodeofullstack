"""
Email verification utilities for user registration
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


def _build_from_address() -> str:
    # Prefer explicit DEFAULT_FROM_EMAIL, fall back to EMAIL_HOST_USER, then a safe local default
    from_addr = (getattr(settings, 'DEFAULT_FROM_EMAIL', '') or '').strip()
    if not from_addr:
        from_addr = (getattr(settings, 'EMAIL_HOST_USER', '') or '').strip()
    if not from_addr:
        # derive domain from FRONTEND_URL if available, else use localhost
        raw = getattr(settings, 'FRONTEND_URL', '') or getattr(settings, 'ALLOWED_HOSTS', ['localhost'])[0]
        host = urlparse(raw).hostname or (raw if isinstance(raw, str) else 'localhost')
        from_addr = f"no-reply@{host}"
    return from_addr


def send_verification_email(user, code):
    """
    Send email verification email to user with verification code
    Returns True if SMTP accepted the message. In DEBUG, address/SMTP errors raise.
    """
    # Validate recipient
    to_addr = (getattr(user, 'email', '') or '').strip()
    if not to_addr or '@' not in to_addr:
        msg = f"Invalid recipient email: '{to_addr}'"
        logger.error(msg)
        if getattr(settings, 'DEBUG', False):
            raise ValueError(msg)
        return False

    try:
        # Determine frontend URL - REQUIRED in production
        frontend_url = (
            getattr(settings, 'FRONTEND_URL', None)
            or getattr(settings, 'NEXT_PUBLIC_APP_URL', None)
        )
        
        # Log what we found
        logger.info(f"FRONTEND_URL from settings: {getattr(settings, 'FRONTEND_URL', None)}")
        logger.info(f"NEXT_PUBLIC_APP_URL from settings: {getattr(settings, 'NEXT_PUBLIC_APP_URL', None)}")
        logger.info(f"DEBUG mode: {getattr(settings, 'DEBUG', False)}")
        
        # Only use localhost fallback in DEBUG mode
        if not frontend_url:
            if getattr(settings, 'DEBUG', False):
                frontend_url = 'http://localhost:3000'
                logger.warning("FRONTEND_URL not set, using localhost fallback (DEBUG mode)")
            else:
                # Production: fail if not set
                error_msg = "FRONTEND_URL must be set in production environment"
                logger.error(error_msg)
                # In production, use a safe default that will be obvious if wrong
                frontend_url = 'https://pagerodeo.com'
                logger.warning(f"FRONTEND_URL not set in production, using default: {frontend_url}")
        
        # Fix common mistake: if someone set it to backend URL, use frontend default
        if frontend_url == 'http://localhost:8000':
            frontend_url = 'http://localhost:3000' if getattr(settings, 'DEBUG', False) else 'https://pagerodeo.com'
        
        # Prevent localhost URLs in production (even if DEBUG is accidentally True)
        if 'localhost' in frontend_url.lower() and not getattr(settings, 'DEBUG', False):
            logger.error(f"Localhost URL detected in production: {frontend_url}. Falling back to https://pagerodeo.com")
            frontend_url = 'https://pagerodeo.com'
        
        # Strip whitespace and trailing slashes
        frontend_url = frontend_url.strip().rstrip('/') if frontend_url else None
        
        logger.info(f"Using frontend URL for verification email: {frontend_url}")
        verification_link = f"{frontend_url}/verify-email?code={code}"

        subject = "Verify your PageRodeo account"
        context = {
            'user': user,
            'verification_link': verification_link,
            'code': code,
            'expiration_hours': 24,
        }

        html_message = render_to_string('emails/verify_email.html', context)
        plain_message = strip_tags(html_message)
        from_addr = _build_from_address()

        # Final safety on from_addr
        if not from_addr or '@' not in from_addr:
            msg = f"Invalid from email: '{from_addr}'"
            logger.error(msg)
            if getattr(settings, 'DEBUG', False):
                raise ValueError(msg)
            return False

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_addr,
            recipient_list=[to_addr],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Verification email sent to {to_addr}")
        return True

    except Exception as e:
        logger.error(f"Failed to send verification email to {to_addr}: {e}", exc_info=True)
        if getattr(settings, 'DEBUG', False):
            raise
        return False

