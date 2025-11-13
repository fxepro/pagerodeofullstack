#!/usr/bin/env python
"""Test script to verify site_settings URLs are loading"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Now test URL loading
from django.urls import get_resolver
from django.conf import settings

print("=" * 60)
print("URL LOADING TEST")
print("=" * 60)

# Get URL resolver
resolver = get_resolver()
url_patterns = resolver.url_patterns

print(f"\nTotal URL patterns: {len(url_patterns)}")
print("\nSearching for palette/typography URLs...")

found_palette = False
found_typography = False

for pattern in url_patterns:
    pattern_str = str(pattern.pattern)
    if 'palette' in pattern_str.lower():
        print(f"  ✓ FOUND: {pattern_str}")
        found_palette = True
    if 'typography' in pattern_str.lower():
        print(f"  ✓ FOUND: {pattern_str}")
        found_typography = True

print("\n" + "=" * 60)
print("RESULTS:")
print("=" * 60)
print(f"Palette URLs found: {'✅ YES' if found_palette else '❌ NO'}")
print(f"Typography URLs found: {'✅ YES' if found_typography else '❌ NO'}")

if not found_palette or not found_typography:
    print("\n⚠️ site_settings URLs are NOT being loaded!")
    print("Check backend/core/urls.py")
else:
    print("\n✅ All site_settings URLs are loaded successfully!")

