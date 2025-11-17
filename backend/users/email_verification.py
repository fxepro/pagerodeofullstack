"""
Email verification utilities for user registration
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


def send_verification_email(user, token):
    """
    Send email verification email to user
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
        # Determine frontend URL
        frontend_url = (
            getattr(settings, 'FRONTEND_URL', None)
            or getattr(settings, 'NEXT_PUBLIC_APP_URL', None)
            or 'http://localhost:3000'
        )
        if frontend_url == 'http://localhost:8000':
            frontend_url = 'http://localhost:3000'
        verification_link = f"{frontend_url.rstrip('/')}/verify-email?token={token}"

        subject = "Verify your PageRodeo account"
        context = {
            'user': user,
            'verification_link': verification_link,
            'token': token,
            'expiration_hours': 24,
        }

        html_message = render_to_string('emails/verify_email.html', context)
        plain_message = strip_tags(html_message)
        
        # ALWAYS pull from Django settings
        email_host_user = (getattr(settings, 'EMAIL_HOST_USER', None) or '').strip()
        default_from_email = (getattr(settings, 'DEFAULT_FROM_EMAIL', None) or '').strip()
        
        logger.info(f"Email config check: EMAIL_HOST_USER='{email_host_user}', DEFAULT_FROM_EMAIL='{default_from_email}'")
        
        from_addr = email_host_user or default_from_email

        if not from_addr or '@' not in from_addr:
            msg = "No valid FROM email configured in settings. Set EMAIL_HOST_USER or DEFAULT_FROM_EMAIL."
            logger.error(f"{msg} EMAIL_HOST_USER='{email_host_user}', DEFAULT_FROM_EMAIL='{default_from_email}'")
            if getattr(settings, 'DEBUG', False):
                raise ValueError(msg)
            return False

        # Use Django's send_mail - it will use EMAIL_* settings from Django settings
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_addr,
            recipient_list=[to_addr],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Verification email sent to {to_addr} from {from_addr}")
        return True

    except Exception as e:
        logger.error(f"Failed to send verification email to {to_addr}: {e}", exc_info=True)
        if getattr(settings, 'DEBUG', False):
            raise
        return False
