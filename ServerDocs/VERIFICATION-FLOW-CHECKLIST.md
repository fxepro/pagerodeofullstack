# Email Verification Flow - Complete Checklist

## Overview
This checklist verifies the complete email verification flow from code generation to login redirect.

## Quick Summary Checklist

### ✅ Step 1: Generate Code and Store in UserProfile
- [ ] Code is generated using `generate_verification_code()` method
- [ ] Code is stored in `email_verification_code` field in database
- [ ] Old `email_verification_token` field is cleared (set to NULL)
- [ ] Code format is human-readable (e.g., "ABC-123-XYZ")
- [ ] Code generation happens during registration and email resend

### ✅ Step 2: Code is Embedded in the Email
- [ ] Email verification function accepts `code` parameter (not `token`)
- [ ] Verification link in email uses `?code=` parameter (not `?token=`)
- [ ] Email template displays the code to user
- [ ] Email link format: `https://pagerodeo.com/verify-email?code=ABC-123-XYZ`

### ✅ Step 3: Verify-Email Page Verifies for Code (Not Token)
- [ ] Frontend extracts `code` from URL parameter
- [ ] Frontend sends `{ code: "..." }` to API (not `{ token: "..." }`)
- [ ] Backend accepts `code` parameter in verify_email endpoint
- [ ] Backend uses `verify_code()` method (not `verify_token()`)
- [ ] Error messages say "code" not "token" (e.g., "Invalid verification code")
- [ ] Backward compatibility: Still accepts `?token=` from old emails

### ✅ Step 4: Clean Handover to Working Login Page from Verification Email
- [ ] When code is in URL, page auto-verifies without showing form
- [ ] Shows minimal "Verifying Email..." loading screen
- [ ] On success, redirects to `/login` page (not dashboard)
- [ ] Does NOT set authentication tokens in localStorage
- [ ] User must login with username/password after verification
- [ ] Verification code is cleared from database after success

---

## ✅ Step 1: Generate Code and Store in UserProfile

### Backend Code Checks

- [ ] **models.py** - `generate_verification_code()` method exists
  ```python
  def generate_verification_code(self):
      code = self.generate_human_readable_code()
      self.email_verification_code = code
      self.email_verification_token = None  # Clear old token
      self.email_verification_sent_at = timezone.now()
      self.save()
      return code
  ```
  **Check:** `grep -n "def generate_verification_code" backend/users/models.py`

- [ ] **models.py** - `generate_verification_token()` is REMOVED or not used
  **Check:** `grep -n "def generate_verification_token" backend/users/models.py`
  **Expected:** Should return nothing or method should be commented/removed

- [ ] **views.py** - Registration uses `generate_verification_code()`
  ```python
  code = profile.generate_verification_code()
  ```
  **Check:** `grep -n "generate_verification_code()" backend/users/views.py`
  **Expected:** Should find in `register_user()` function

- [ ] **views.py** - `send_verification_email_endpoint` uses `generate_verification_code()`
  **Check:** `grep -A 5 "send_verification_email_endpoint" backend/users/views.py | grep "generate_verification_code"`
  **Expected:** Should find the call

- [ ] **views.py** - `resend_verification_email` uses `generate_verification_code()`
  **Check:** `grep -A 5 "resend_verification_email" backend/users/views.py | grep "generate_verification_code"`
  **Expected:** Should find the call

### Database Checks

- [ ] **Database** - Code is stored in `email_verification_code` field
  ```sql
  SELECT email, email_verification_code, email_verification_token, email_verification_sent_at
  FROM users_userprofile
  WHERE email_verification_code IS NOT NULL
  ORDER BY email_verification_sent_at DESC
  LIMIT 5;
  ```
  **Expected:** 
  - `email_verification_code` should have values like "ABC-123-XYZ"
  - `email_verification_token` should be NULL

- [ ] **Database** - Old tokens are cleared
  **Check:** Count of profiles with tokens but no codes
  ```sql
  SELECT COUNT(*) FROM users_userprofile 
  WHERE email_verification_token IS NOT NULL 
  AND email_verification_code IS NULL;
  ```
  **Expected:** Should be 0 (or only very old records)

### Runtime Test

- [ ] **Test Registration** - Register new user and check database
  ```bash
  # Register via API
  curl -X POST http://localhost:8000/api/auth/register/ \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","email":"test@example.com","password":"Test123!@#"}'
  
  # Check database
  python manage.py shell -c "from users.models import UserProfile; p=UserProfile.objects.filter(user__email='test@example.com').first(); print(f'Code: {p.email_verification_code}, Token: {p.email_verification_token}')"
  ```
  **Expected:** Code should be set (format: XXX-XXX-XXX), Token should be NULL

---

## ✅ Step 2: Code is Embedded in the Email

### Backend Code Checks

- [ ] **email_verification.py** - Function signature uses `code` parameter
  ```python
  def send_verification_email(user, code):
  ```
  **Check:** `grep -n "def send_verification_email" backend/users/email_verification.py`
  **Expected:** Should show `(user, code)` not `(user, token)`

- [ ] **email_verification.py** - Verification link uses `?code=`
  ```python
  verification_link = f"{frontend_url}/verify-email?code={code}"
  ```
  **Check:** `grep -n "verify-email" backend/users/email_verification.py`
  **Expected:** Should show `?code={code}` not `?token={token}`

- [ ] **views.py** - Calls `send_verification_email(user, code)`
  **Check:** `grep -n "send_verification_email(user, code)" backend/users/views.py`
  **Expected:** Should find calls with `code` parameter

- [ ] **views.py** - No calls to `send_verification_email(user, token)`
  **Check:** `grep -n "send_verification_email(user, token)" backend/users/views.py`
  **Expected:** Should return nothing

### Email Template Checks

- [ ] **Email Template** - Uses `{{ code }}` variable
  **Check:** `grep -n "code" backend/templates/emails/verify_email.html`
  **Expected:** Should show code being displayed in email

- [ ] **Email Template** - Link uses `{{ verification_link }}` which contains `?code=`
  **Check:** View email template file
  **Expected:** Link should be clickable and contain `?code=`

### Runtime Test

- [ ] **Test Email Sending** - Send verification email and check content
  ```bash
  # Trigger email send
  curl -X POST http://localhost:8000/api/auth/send-verification/ \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  
  # Check email logs or actual email
  # Look for: ?code=ABC-123-XYZ in the link
  ```
  **Expected:** Email should contain link with `?code=` parameter

- [ ] **Email Link Format** - Verify link structure
  **Expected Format:** `https://pagerodeo.com/verify-email?code=ABC-123-XYZ`
  **NOT:** `https://pagerodeo.com/verify-email?token=uuid-here`

---

## ✅ Step 3: Verify-Email Page Verifies for Code (Not Token)

### Frontend Code Checks

- [ ] **page.tsx** - Extracts `code` from URL (with backward compatibility for `token`)
  ```typescript
  const codeFromUrl = searchParams.get('code') || searchParams.get('token');
  ```
  **Check:** `grep -n "searchParams.get('code')" studio/app/verify-email/page.tsx`
  **Expected:** Should handle both `code` and `token` for backward compatibility

- [ ] **page.tsx** - API payload uses `code` field
  ```typescript
  const payload = { code: codeToVerify };
  ```
  **Check:** `grep -n "code:" studio/app/verify-email/page.tsx`
  **Expected:** Should send `{ code: "..." }` not `{ token: "..." }`

- [ ] **page.tsx** - API endpoint is correct
  ```typescript
  const url = `${API_BASE}/api/auth/verify-email/`;
  ```
  **Check:** `grep -n "/api/auth/verify-email" studio/app/verify-email/page.tsx`
  **Expected:** Should point to correct endpoint

### Backend Code Checks

- [ ] **views.py** - `verify_email` endpoint accepts `code` parameter
  ```python
  code = request.data.get('code', '').strip()
  ```
  **Check:** `grep -A 3 "def verify_email" backend/users/views.py | grep "code ="`
  **Expected:** Should extract `code` from request data

- [ ] **views.py** - Uses `verify_code()` method
  ```python
  if profile.verify_code(code):
  ```
  **Check:** `grep -n "verify_code" backend/users/views.py`
  **Expected:** Should use `verify_code()` not `verify_token()`

- [ ] **views.py** - Error messages mention "code" not "token"
  ```python
  return Response({'error': 'Verification code is required'}, ...)
  return Response({'error': 'Invalid verification code'}, ...)
  ```
  **Check:** `grep -n "Verification code\|Invalid.*code" backend/users/views.py`
  **Expected:** Error messages should say "code" not "token"

### Error Message Consistency

- [ ] **Backend** - All error messages use "code" terminology
  - "Verification code is required"
  - "Invalid verification code"
  - "Verification code has expired"
  **Check:** `grep -i "code\|token" backend/users/views.py | grep -i "error\|invalid\|required"`
  **Expected:** Should only see "code" in error messages

- [ ] **Frontend** - Error display shows "code" terminology
  **Check:** View `studio/app/verify-email/page.tsx` error messages
  **Expected:** User-facing messages should say "code" not "token"

### Runtime Test

- [ ] **Test Verification** - Verify with code
  ```bash
  # Get a code from database first
  CODE="ABC-123-XYZ"  # Replace with actual code
  
  # Test verification
  curl -X POST http://localhost:8000/api/auth/verify-email/ \
    -H "Content-Type: application/json" \
    -d "{\"code\": \"$CODE\"}"
  ```
  **Expected:** Should return success with `email_verified: true`

- [ ] **Test Invalid Code** - Error message should mention "code"
  ```bash
  curl -X POST http://localhost:8000/api/auth/verify-email/ \
    -H "Content-Type: application/json" \
    -d '{"code": "INVALID-CODE"}'
  ```
  **Expected:** Error should say "Invalid verification code" not "Invalid token"

- [ ] **Test Missing Code** - Error message should mention "code"
  ```bash
  curl -X POST http://localhost:8000/api/auth/verify-email/ \
    -H "Content-Type: application/json" \
    -d '{}'
  ```
  **Expected:** Error should say "Verification code is required"

---

## ✅ Step 4: Clean Handover to Working Login Page from Verification Email

### Frontend Code Checks

- [ ] **page.tsx** - Auto-verifies when code is in URL
  ```typescript
  if (codeFromUrl) {
    // Auto-verify and redirect
    verifyAndRedirect();
  }
  ```
  **Check:** `grep -A 10 "codeFromUrl" studio/app/verify-email/page.tsx`
  **Expected:** Should automatically verify when code is in URL

- [ ] **page.tsx** - Redirects to `/login` on success
  ```typescript
  if (res.data?.email_verified) {
    router.push("/login");
  }
  ```
  **Check:** `grep -n "router.push.*login" studio/app/verify-email/page.tsx`
  **Expected:** Should redirect to `/login` not `/dashboard`

- [ ] **page.tsx** - Shows minimal loading screen during verification
  **Check:** View loading state in `studio/app/verify-email/page.tsx`
  **Expected:** Should show "Verifying Email..." not full form

- [ ] **page.tsx** - Does NOT set tokens in localStorage
  **Check:** `grep -n "localStorage.*token" studio/app/verify-email/page.tsx`
  **Expected:** Should NOT set access_token or refresh_token

### Backend Code Checks

- [ ] **views.py** - `verify_email` does NOT return JWT tokens
  ```python
  return Response({
      'message': 'Email verified successfully. Please log in...',
      'email_verified': True,
  })
  ```
  **Check:** `grep -A 10 "Email verified successfully" backend/users/views.py`
  **Expected:** Should NOT include `access_token` or `refresh_token`

- [ ] **views.py** - Clears verification code after success
  ```python
  verified_profile.email_verification_code = None
  verified_profile.email_verification_sent_at = None
  ```
  **Check:** `grep -A 5 "email_verified = True" backend/users/views.py`
  **Expected:** Should clear code and sent_at fields

### User Flow Test

- [ ] **Complete Flow Test** - From email click to login page
  1. Register new user
  2. Check email for verification link
  3. Click link (should have `?code=ABC-123-XYZ`)
  4. Should see "Verifying Email..." briefly
  5. Should redirect to `/login` page
  6. Should NOT be logged in (no tokens in localStorage)
  7. Should be able to login with username/password

- [ ] **Login Page** - Works after verification
  - User can enter username/password
  - Login succeeds
  - User is redirected to dashboard
  - User is properly authenticated

### Browser Console Checks

- [ ] **No Errors** - Check browser console during verification
  - No 404 errors
  - No authentication errors
  - No redirect loops
  **Check:** Open browser DevTools → Console tab during verification

- [ ] **Network Tab** - Verify API calls
  - POST to `/api/auth/verify-email/` with `{ code: "..." }`
  - Response: `{ email_verified: true, message: "..." }`
  - Redirect to `/login` (status 200)
  **Check:** Open browser DevTools → Network tab

---

## 🔧 Quick Fix Commands

If any check fails, run these commands on the VM:

```bash
cd /opt/pagerodeofullstack

# Pull latest code
git pull origin main

# Restart services
sudo systemctl restart pagerodeo-django
sudo systemctl restart pagerodeo-frontend

# Check logs
sudo journalctl -u pagerodeo-django -n 50
sudo journalctl -u pagerodeo-frontend -n 50
```

---

## 📋 Automated Check Script

Run the comprehensive check script:

```bash
cd /opt/pagerodeofullstack
chmod +x ServerDocs/check-verification-code-migration.sh
sudo ./ServerDocs/check-verification-code-migration.sh
```

This script will automatically verify all the above points and report any issues.

