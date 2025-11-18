#!/usr/bin/env python3
"""
End-to-end tester for the email verification flow in DEBUG mode.

Steps:
1) Register a new user via POST /api/register/
2) Request verification email via POST /api/auth/send-verification/ (public, with email)
   - In DEBUG=True, backend responds with { token, verification_link }
3) Verify via POST /api/auth/verify-email/ (returns access/refresh tokens)
4) Call GET /api/user-info/ with Bearer token to confirm access

Usage:
  python test_scripts/test_email_verification_flow.py \
      --api http://localhost:8000 \
      --email you@example.com \
      --username testuser123 \
      --password "StrongPass123!"

Notes:
- Requires backend running with DEBUG=True to receive token in step 2 response.
- If you don’t receive token in step 2, your SMTP is active and the email was accepted; check your inbox/spam
  or temporarily set EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend to see the email in console.
"""
import argparse
import random
import string
import sys
import time
import requests


def rand_suffix(n: int = 6) -> str:
    return ''.join(random.choice(string.ascii_lowercase + string.digits) for _ in range(n))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--api', default='http://localhost:8000', help='Base URL of backend API, e.g. http://localhost:8000')
    parser.add_argument('--email', required=True, help='Email address to register / verify')
    parser.add_argument('--username', default=f'testuser_{rand_suffix()}', help='Username to register')
    parser.add_argument('--password', default='TestPassw0rd!42', help='Password to register/login')
    args = parser.parse_args()

    api = args.api.rstrip('/')
    email = args.email
    username = args.username
    password = args.password

    print(f"[1/4] Registering user: {username} <{email}> ...")
    r = requests.post(f"{api}/api/register/", json={
        'username': username,
        'email': email,
        'password': password,
        'first_name': 'Test',
        'last_name': 'User',
        'role': 'viewer'
    }, timeout=10)
    print(f"  -> status {r.status_code}")
    try:
        print("  -> response:", r.json())
    except Exception:
        print("  -> response (raw):", r.text)

    if r.status_code not in (200, 201):
        print("Registration failed; aborting.")
        sys.exit(1)

    print("[2/4] Requesting verification email (public send-verification)...")
    r = requests.post(f"{api}/api/auth/send-verification/", json={'email': email}, timeout=10)
    print(f"  -> status {r.status_code}")
    try:
        body = r.json()
        print("  -> response:", body)
    except Exception:
        body = None
        print("  -> response (raw):", r.text)

    token = None
    if isinstance(body, dict):
        token = body.get('token')
        vlink = body.get('verification_link')
        if token:
            print(f"  -> got DEBUG token: {token}")
            if vlink:
                print(f"  -> verification link: {vlink}")

    if not token:
        print("No token in response. If backend DEBUG=True, expected a token. If not, check your inbox/spam or use console email backend.")
        # Try /api/auth/resend-verification/ (also returns token in DEBUG)
        print("[2b] Trying public resend-verification...")
        r2 = requests.post(f"{api}/api/auth/resend-verification/", json={'email': email}, timeout=10)
        print(f"  -> status {r2.status_code}")
        try:
            body2 = r2.json()
            print("  -> response:", body2)
        except Exception:
            body2 = None
            print("  -> response (raw):", r2.text)
        if isinstance(body2, dict) and body2.get('token'):
            token = body2['token']
            print(f"  -> got DEBUG token (resend): {token}")

    if not token:
        print("Cannot proceed to verify without a token.")
        sys.exit(2)

    print("[3/4] Verifying token ...")
    r = requests.post(f"{api}/api/auth/verify-email/", json={'token': token}, timeout=10)
    print(f"  -> status {r.status_code}")
    try:
        body = r.json()
        print("  -> response:", body)
    except Exception:
        body = None
        print("  -> response (raw):", r.text)

    if r.status_code != 200 or not (body and body.get('email_verified')):
        print("Verification failed or did not return email_verified=true")
        sys.exit(3)

    access = body.get('access_token')
    refresh = body.get('refresh_token')
    if access:
        print("[3b] Received access token; testing /api/user-info/ ...")
        r = requests.get(f"{api}/api/user-info/", headers={'Authorization': f'Bearer {access}'}, timeout=10)
        print(f"  -> status {r.status_code}")
        try:
            print("  -> response:", r.json())
        except Exception:
            print("  -> response (raw):", r.text)
        if r.status_code != 200:
            print("user-info check failed.")
            sys.exit(4)
    else:
        print("No access_token in verify response (older email?) — try logging in manually with /api/token/")

    print("[4/4] SUCCESS: Email verification flow completed.")


if __name__ == '__main__':
    main()
