#!/usr/bin/env python
"""Quick email verification check - no input required"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
from site_settings.models import SiteConfig

config = SiteConfig.get_config()
print(f"Email verification enabled: {config.enable_email_verification}")
print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER or '(NOT SET)'}")
print(f"EMAIL_HOST_PASSWORD: {'SET' if settings.EMAIL_HOST_PASSWORD else '(NOT SET)'}")
print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL or '(NOT SET)'}")

