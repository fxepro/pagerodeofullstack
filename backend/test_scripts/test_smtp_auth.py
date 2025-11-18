#!/usr/bin/env python3
"""
SMTP connectivity tester using Django settings.

- Loads EMAIL_* from Django settings (so run from project virtualenv)
- Tries to connect to SMTP, STARTTLS if configured, then login
- Optionally sends a test message to a recipient

Usage:
  cd backend
  python test_scripts/test_smtp_auth.py                      # just test connection/auth
  python test_scripts/test_smtp_auth.py --to someone@ex.com  # also send a test mail
"""
import argparse
import smtplib
import ssl
from email.message import EmailMessage
import sys
import os
from pathlib import Path

# Ensure Django settings are importable by adding backend/ (where core/ lives) to sys.path
HERE = Path(__file__).resolve()
BACKEND_DIR = HERE.parent.parent  # .../backend
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Point to core.settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    import django  # type: ignore
    django.setup()
except Exception as e:
    print(f"[!] Failed to initialize Django with DJANGO_SETTINGS_MODULE={os.environ.get('DJANGO_SETTINGS_MODULE')}\n"
          f"    CWD={os.getcwd()}\n    sys.path[0]={sys.path[0]}\n    Error: {e}")
    sys.exit(2)

from django.conf import settings  # type: ignore


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--to', help='Optional recipient to send a test email')
    parser.add_argument('--subject', default='SMTP Test')
    parser.add_argument('--body', default='This is a test email from SMTP tester.')
    args = parser.parse_args()

    host = getattr(settings, 'EMAIL_HOST', None)
    port = int(getattr(settings, 'EMAIL_PORT', 0) or 0)
    use_tls = bool(getattr(settings, 'EMAIL_USE_TLS', False))
    use_ssl = bool(getattr(settings, 'EMAIL_USE_SSL', False))
    user = (getattr(settings, 'EMAIL_HOST_USER', '') or '').strip()
    password = (getattr(settings, 'EMAIL_HOST_PASSWORD', '') or '').strip()

    print("[i] Loaded settings:")
    print(f"    EMAIL_HOST={host}")
    print(f"    EMAIL_PORT={port}")
    print(f"    EMAIL_USE_TLS={use_tls}")
    print(f"    EMAIL_USE_SSL={use_ssl}")
    print(f"    EMAIL_HOST_USER={repr(user)}")
    print(f"    DEFAULT_FROM_EMAIL={repr((getattr(settings, 'DEFAULT_FROM_EMAIL', '') or '').strip())}")

    if not host or not port:
        print("[!] Missing EMAIL_HOST/EMAIL_PORT in settings")
        return 2

    try:
        if use_ssl:
            context = ssl.create_default_context()
            server = smtplib.SMTP_SSL(host, port, context=context, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
        server.ehlo()
        if use_tls:
            server.starttls()
            server.ehlo()
        if user:
            print(f"[i] Logging in as {user} ...")
            server.login(user, password)
            print("[✓] SMTP AUTH OK")
        else:
            print("[i] No EMAIL_HOST_USER set; skipping AUTH (server may reject relaying)")

        if args.to:
            from_addr = (getattr(settings, 'DEFAULT_FROM_EMAIL', '') or user or 'no-reply@localhost').strip()
            msg = EmailMessage()
            msg['From'] = from_addr
            msg['To'] = args.to
            msg['Subject'] = args.subject
            msg.set_content(args.body)

            print(f"[i] Sending test message From {from_addr} -> {args.to} ...")
            server.send_message(msg)
            print("[✓] Message accepted by SMTP server")

        server.quit()
        print("[✓] SMTP connectivity test complete")
        return 0
    except Exception as e:
        print(f"[✗] SMTP test failed: {e}")
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
