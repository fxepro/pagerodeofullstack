# API Testing Checklist - Production

## Prerequisites

1. ✅ Database created
2. ✅ Migrations run
3. ✅ Superuser created
4. ✅ Services running (backend + frontend)

---

## Step 1: Run Migrations (If Not Done)

```bash
cd /opt/pagerodeofullstack/backend
source venv/bin/activate
python manage.py migrate
```

**Expected:** All migrations applied successfully

---

## Step 2: Create Superuser (If Not Done)

```bash
cd /opt/pagerodeofullstack/backend
source venv/bin/activate
python manage.py createsuperuser
```

**Enter:**
- Username
- Email
- Password

---

## Step 3: API Testing Checklist

### 🔐 Authentication APIs

#### 1. User Registration
```bash
POST http://your-domain.com/api/register/
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "SecurePass123!",
  "first_name": "Test",
  "last_name": "User"
}
```
**Expected:** 201 Created, returns user data + verification token (if DEBUG=True)

#### 2. User Login
```bash
POST http://your-domain.com/api/token/
Content-Type: application/json

{
  "username": "testuser",
  "password": "SecurePass123!"
}
```
**Expected:** 200 OK, returns `access` and `refresh` tokens

#### 3. Get User Info (Authenticated)
```bash
GET http://your-domain.com/api/user-info/
Authorization: Bearer <access_token>
```
**Expected:** 200 OK, returns user data including `email_verified` status

#### 4. Refresh Token
```bash
POST http://your-domain.com/api/token/refresh/
Content-Type: application/json

{
  "refresh": "<refresh_token>"
}
```
**Expected:** 200 OK, returns new `access` token

---

### 📧 Email Verification APIs

#### 5. Send Verification Email
```bash
POST http://your-domain.com/api/send-verification-email/
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "email": "test@example.com"
}
```
**Expected:** 200 OK, email sent

#### 6. Verify Email with Token
```bash
POST http://your-domain.com/api/verify-email/
Content-Type: application/json

{
  "token": "<verification_token>"
}
```
**Expected:** 200 OK, email verified

#### 7. Resend Verification Email
```bash
POST http://your-domain.com/api/resend-verification-email/
Content-Type: application/json

{
  "email": "test@example.com"
}
```
**Expected:** 200 OK, new verification email sent

---

### 🔍 Monitoring APIs

#### 8. List Monitored Sites
```bash
GET http://your-domain.com/api/monitor/sites/
Authorization: Bearer <access_token>
```
**Expected:** 200 OK, returns list of monitored sites

#### 9. Add Monitored Site
```bash
POST http://your-domain.com/api/monitor/sites/
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "url": "example.com"
}
```
**Expected:** 201 Created, returns site data

#### 10. Get Site Details
```bash
GET http://your-domain.com/api/monitor/sites/<site_id>/
Authorization: Bearer <access_token>
```
**Expected:** 200 OK, returns site details with status, response time, etc.

#### 11. Delete Monitored Site
```bash
DELETE http://your-domain.com/api/monitor/sites/<site_id>/
Authorization: Bearer <access_token>
```
**Expected:** 204 No Content

---

### 📊 Site Audit APIs

#### 12. Run Site Audit
```bash
POST http://your-domain.com/api/analyze/
Content-Type: application/json

{
  "url": "example.com"
}
```
**Expected:** 200 OK, returns audit results

#### 13. DNS Analysis
```bash
POST http://your-domain.com/api/dns/
Content-Type: application/json

{
  "domain": "example.com"
}
```
**Expected:** 200 OK, returns DNS records

#### 14. SSL Analysis
```bash
POST http://your-domain.com/api/ssl/
Content-Type: application/json

{
  "domain": "example.com"
}
```
**Expected:** 200 OK, returns SSL certificate info

#### 15. Links Analysis
```bash
POST http://your-domain.com/api/links/
Content-Type: application/json

{
  "url": "https://example.com"
}
```
**Expected:** 200 OK, returns discovered links

---

### ⚙️ Settings APIs

#### 16. Get Site Settings
```bash
GET http://your-domain.com/api/site-settings/
```
**Expected:** 200 OK, returns site settings (public endpoint)

#### 17. Get Typography Presets
```bash
GET http://your-domain.com/api/typography/presets/
```
**Expected:** 200 OK, returns typography presets

#### 18. Get Active Typography
```bash
GET http://your-domain.com/api/typography/active/
```
**Expected:** 200 OK, returns active typography preset

---

### 📄 Reports APIs

#### 19. List Audit Reports
```bash
GET http://your-domain.com/api/audit-reports/
Authorization: Bearer <access_token>
```
**Expected:** 200 OK, returns list of reports

#### 20. Get Report Details
```bash
GET http://your-domain.com/api/audit-reports/<report_id>/
Authorization: Bearer <access_token>
```
**Expected:** 200 OK, returns report data

---

### 🔒 Security & Admin APIs

#### 21. Django Admin Login
```
URL: http://your-domain.com/admin/
Method: GET (then POST with credentials)
```
**Expected:** Admin login page loads, can log in with superuser

#### 22. Django Admin Dashboard
```
URL: http://your-domain.com/admin/
Authorization: Logged in as superuser
```
**Expected:** Admin dashboard with all models visible

#### 23. Admin - Users Management
```
URL: http://your-domain.com/admin/users/userprofile/
```
**Expected:** List of user profiles, can view/edit

#### 24. Admin - Monitored Sites
```
URL: http://your-domain.com/admin/users/monitoredsite/
```
**Expected:** List of monitored sites

#### 25. Admin - Site Settings
```
URL: http://your-domain.com/admin/site_settings/sitesettings/
```
**Expected:** Site settings configuration

---

### 🧪 Health Check APIs

#### 26. API Root
```bash
GET http://your-domain.com/api/
```
**Expected:** 200 OK, API root endpoint

#### 27. API Schema (OpenAPI)
```bash
GET http://your-domain.com/api/schema/
```
**Expected:** 200 OK, OpenAPI schema JSON

#### 28. API Schema UI (Swagger)
```
URL: http://your-domain.com/api/schema/swagger-ui/
```
**Expected:** Swagger UI interface

#### 29. API Schema UI (ReDoc)
```
URL: http://your-domain.com/api/schema/redoc/
```
**Expected:** ReDoc interface

---

## Step 4: Frontend Testing

### 30. Homepage
```
URL: http://your-domain.com/
```
**Expected:** Homepage loads, can enter URL for analysis

### 31. Login Page
```
URL: http://your-domain.com/login
```
**Expected:** Login form loads

### 32. Register Page
```
URL: http://your-domain.com/register
```
**Expected:** Registration form loads

### 33. Verify Email Page
```
URL: http://your-domain.com/verify-email
```
**Expected:** Email verification form loads

### 34. Dashboard (Authenticated)
```
URL: http://your-domain.com/dashboard
Authorization: Logged in user
```
**Expected:** Dashboard loads with user data

### 35. Settings Page
```
URL: http://your-domain.com/dashboard/settings
Authorization: Logged in user
```
**Expected:** Settings page loads

---

## Step 5: Error Handling Tests

### 36. Invalid Token
```bash
GET http://your-domain.com/api/user-info/
Authorization: Bearer invalid_token_here
```
**Expected:** 401 Unauthorized

### 37. Expired Token
```bash
# Wait for token to expire (30 minutes) or use old token
GET http://your-domain.com/api/user-info/
Authorization: Bearer <expired_token>
```
**Expected:** 401 Unauthorized, redirects to login

### 38. Unverified User Login
```bash
# Login with unverified user
POST http://your-domain.com/api/token/
# Then try to access dashboard
GET http://your-domain.com/api/user-info/
```
**Expected:** User blocked, redirected to verify-email page

### 39. Rate Limiting
```bash
# Make many rapid requests
for i in {1..100}; do
  curl http://your-domain.com/api/analyze/ -X POST -H "Content-Type: application/json" -d '{"url":"example.com"}'
done
```
**Expected:** 429 Too Many Requests after limit

---

## Step 6: Database Verification

### 40. Check Database Tables
```bash
sudo -u postgres psql -d pagerodeo -c "\dt"
```
**Expected:** All Django tables listed (auth_user, users_userprofile, etc.)

### 41. Check User Count
```bash
sudo -u postgres psql -d pagerodeo -c "SELECT COUNT(*) FROM auth_user;"
```
**Expected:** At least 1 (superuser)

### 42. Check Migrations Applied
```bash
cd /opt/pagerodeofullstack/backend
source venv/bin/activate
python manage.py showmigrations
```
**Expected:** All migrations marked with [X]

---

## Quick Test Scripts

### Comprehensive Test Script (Bash)

**Location:** `scripts/test-all-apis.sh`

**Usage:**
```bash
cd /opt/pagerodeofullstack
chmod +x scripts/test-all-apis.sh
bash scripts/test-all-apis.sh
```

**What it tests:**
- All health check APIs
- Authentication (registration, login, token refresh)
- Email verification APIs
- Monitoring APIs
- Site audit APIs
- Settings APIs
- Reports APIs
- Admin and frontend pages
- Error handling

### Comprehensive Test Script (PowerShell)

**Location:** `scripts/test-all-apis.ps1`

**Usage:**
```powershell
cd C:\path\to\project
.\scripts\test-all-apis.ps1
```

### Quick Test Script (Simple)

Save this as `test-apis-quick.sh`:

```bash
#!/bin/bash
BASE_URL="http://129.146.57.158"

echo "Testing APIs..."

# 1. API Root
echo "1. API Root..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/" && echo " ✓" || echo " ✗"

# 2. Schema
echo "2. API Schema..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/schema/" && echo " ✓" || echo " ✗"

# 3. Site Settings
echo "3. Site Settings..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/site-settings/" && echo " ✓" || echo " ✗"

# 4. Admin
echo "4. Django Admin..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/admin/" && echo " ✓" || echo " ✗"

echo "Done!"
```

---

## Priority Testing Order

1. **Critical (Do First):**
   - ✅ Migrations run
   - ✅ Superuser created
   - ✅ Django Admin accessible
   - ✅ User registration
   - ✅ User login
   - ✅ Email verification flow

2. **Important (Do Second):**
   - ✅ User info endpoint
   - ✅ Monitoring APIs
   - ✅ Site audit APIs
   - ✅ Frontend pages load

3. **Nice to Have:**
   - ✅ Reports APIs
   - ✅ Settings APIs
   - ✅ Error handling
   - ✅ Rate limiting

---

## Notes

- **Production URL:** `http://129.146.57.158`
- **API Base:** `http://129.146.57.158/api`
- **Admin:** `http://129.146.57.158/admin`
- For local testing: `http://localhost:8000` (backend) and `http://localhost:3000` (frontend)
- All authenticated endpoints require `Authorization: Bearer <token>` header
- Check logs if any test fails: `sudo journalctl -u pagerodeo-backend -n 50`

## Running the Test Script

**On Oracle VM:**
```bash
cd /opt/pagerodeofullstack
chmod +x scripts/test-all-apis.sh
bash scripts/test-all-apis.sh
```

**On Windows (PowerShell):**
```powershell
cd C:\path\to\project
.\scripts\test-all-apis.ps1
```

The script will:
- Test all APIs automatically
- Create a test user for authenticated tests
- Show pass/fail for each endpoint
- Provide a summary at the end

