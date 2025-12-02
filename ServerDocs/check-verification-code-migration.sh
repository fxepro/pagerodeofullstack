#!/bin/bash
#
# Comprehensive check for email verification code/token migration
# Verifies the change from token to code has been applied everywhere
#

set -e

PROJECT_ROOT="/opt/pagerodeofullstack"
STUDIO_DIR="${PROJECT_ROOT}/studio"
BACKEND_DIR="${PROJECT_ROOT}/backend"

echo "=========================================="
echo "Email Verification Code Migration Check"
echo "=========================================="
echo ""

# Check 1: Backend views.py - send_verification_email_endpoint
echo "[1] Checking backend views.py (send_verification_email_endpoint)..."
VIEWS_FILE="${BACKEND_DIR}/users/views.py"
if [ -f "$VIEWS_FILE" ]; then
    echo "✅ File exists: $VIEWS_FILE"
    
    # Check if it uses generate_verification_code (new) or generate_verification_token (old)
    if grep -q "generate_verification_code()" "$VIEWS_FILE"; then
        echo "✅ Uses generate_verification_code() (CORRECT - new code)"
    else
        echo "❌ Does NOT use generate_verification_code()"
    fi
    
    if grep -q "generate_verification_token()" "$VIEWS_FILE"; then
        echo "❌ Still uses generate_verification_token() (OLD CODE - needs update)"
        echo "   Line numbers:"
        grep -n "generate_verification_token()" "$VIEWS_FILE" | head -n 3
    else
        echo "✅ Does NOT use generate_verification_token() (CORRECT)"
    fi
    
    # Check if email link uses ?code= or ?token=
    if grep -q "verify-email?code=" "$VIEWS_FILE"; then
        echo "✅ Email link uses ?code= (CORRECT)"
    else
        echo "❌ Email link does NOT use ?code="
    fi
    
    if grep -q "verify-email?token=" "$VIEWS_FILE"; then
        echo "❌ Email link still uses ?token= (OLD CODE)"
        echo "   Line numbers:"
        grep -n "verify-email?token=" "$VIEWS_FILE" | head -n 3
    else
        echo "✅ Email link does NOT use ?token= (CORRECT)"
    fi
    
    # Check what send_verification_email is called with
    if grep -q "send_verification_email(user, code)" "$VIEWS_FILE"; then
        echo "✅ Calls send_verification_email with 'code' (CORRECT)"
    else
        echo "⚠️  Check how send_verification_email is called"
        grep -n "send_verification_email" "$VIEWS_FILE" | head -n 5
    fi
else
    echo "❌ File not found: $VIEWS_FILE"
fi
echo ""

# Check 2: Backend email_verification.py
echo "[2] Checking backend email_verification.py..."
EMAIL_FILE="${BACKEND_DIR}/users/email_verification.py"
if [ -f "$EMAIL_FILE" ]; then
    echo "✅ File exists: $EMAIL_FILE"
    
    # Check function signature
    if grep -q "def send_verification_email(user, code):" "$EMAIL_FILE"; then
        echo "✅ Function signature uses 'code' parameter (CORRECT)"
    else
        echo "❌ Function signature does NOT use 'code'"
        grep -n "def send_verification_email" "$EMAIL_FILE"
    fi
    
    # Check if link uses ?code=
    if grep -q "verify-email?code=" "$EMAIL_FILE"; then
        echo "✅ Email link uses ?code= (CORRECT)"
    else
        echo "❌ Email link does NOT use ?code="
        grep -n "verification_link" "$EMAIL_FILE" | head -n 3
    fi
else
    echo "❌ File not found: $EMAIL_FILE"
fi
echo ""

# Check 3: Frontend verify-email page
echo "[3] Checking frontend verify-email page..."
FRONTEND_FILE="${STUDIO_DIR}/app/verify-email/page.tsx"
if [ -f "$FRONTEND_FILE" ]; then
    echo "✅ File exists: $FRONTEND_FILE"
    
    # Check if it handles both code and token (backward compatibility)
    if grep -q "searchParams.get('code') || searchParams.get('token')" "$FRONTEND_FILE"; then
        echo "✅ Handles both ?code= and ?token= (CORRECT - backward compatible)"
    else
        echo "⚠️  Check how URL params are extracted"
        grep -n "searchParams.get" "$FRONTEND_FILE" | head -n 3
    fi
    
    # Check if payload uses 'code'
    if grep -q "{ code:" "$FRONTEND_FILE" || grep -q "code: codeToVerify" "$FRONTEND_FILE"; then
        echo "✅ API payload uses 'code' field (CORRECT)"
    else
        echo "❌ Check API payload structure"
        grep -n "payload\|body" "$FRONTEND_FILE" | head -n 5
    fi
else
    echo "❌ File not found: $FRONTEND_FILE"
fi
echo ""

# Check 4: Backend models.py - verify_code method
echo "[4] Checking backend models.py (verify_code method)..."
MODELS_FILE="${BACKEND_DIR}/users/models.py"
if [ -f "$MODELS_FILE" ]; then
    echo "✅ File exists: $MODELS_FILE"
    
    if grep -q "def verify_code(self, code):" "$MODELS_FILE"; then
        echo "✅ Has verify_code() method (CORRECT)"
    else
        echo "❌ Missing verify_code() method"
    fi
    
    if grep -q "def generate_verification_code(self):" "$MODELS_FILE"; then
        echo "✅ Has generate_verification_code() method (CORRECT)"
    else
        echo "❌ Missing generate_verification_code() method"
    fi
else
    echo "❌ File not found: $MODELS_FILE"
fi
echo ""

# Check 5: Backend verify_email endpoint
echo "[5] Checking backend verify_email endpoint..."
if [ -f "$VIEWS_FILE" ]; then
    # Check if verify_email accepts 'code' parameter
    if grep -A 10 "def verify_email" "$VIEWS_FILE" | grep -q "code = request.data.get('code'"; then
        echo "✅ verify_email accepts 'code' parameter (CORRECT)"
    else
        echo "❌ verify_email does NOT accept 'code' parameter"
        echo "   Checking what it accepts:"
        grep -A 5 "def verify_email" "$VIEWS_FILE" | head -n 8
    fi
    
    # Check if it uses verify_code method
    if grep -A 20 "def verify_email" "$VIEWS_FILE" | grep -q "verify_code"; then
        echo "✅ Uses verify_code() method (CORRECT)"
    else
        echo "❌ Does NOT use verify_code() method"
    fi
fi
echo ""

# Check 6: Check if services were restarted after deployment
echo "[6] Checking service restart times..."
if systemctl is-active --quiet pagerodeo-frontend 2>/dev/null; then
    SERVICE_NAME="pagerodeo-frontend"
elif systemctl is-active --quiet pagerodeo-nextjs 2>/dev/null; then
    SERVICE_NAME="pagerodeo-nextjs"
else
    SERVICE_NAME=""
fi

if [ -n "$SERVICE_NAME" ]; then
    RESTART_TIME=$(systemctl show "$SERVICE_NAME" --property=ActiveEnterTimestamp --value 2>/dev/null || echo "unknown")
    echo "✅ Service: $SERVICE_NAME"
    echo "   Last started: $RESTART_TIME"
    
    # Check if it was restarted recently (within last hour)
    echo "   → If this is old, restart: sudo systemctl restart $SERVICE_NAME"
else
    echo "❌ Next.js service not found!"
fi

if systemctl is-active --quiet pagerodeo-django 2>/dev/null; then
    DJANGO_RESTART=$(systemctl show pagerodeo-django --property=ActiveEnterTimestamp --value 2>/dev/null || echo "unknown")
    echo "✅ Django service: pagerodeo-django"
    echo "   Last started: $DJANGO_RESTART"
    echo "   → If this is old, restart: sudo systemctl restart pagerodeo-django"
else
    echo "⚠️  Django service not found or not running"
fi
echo ""

# Check 7: Check git commit history
echo "[7] Checking recent commits..."
cd "$PROJECT_ROOT"
if [ -d ".git" ]; then
    echo "Recent commits affecting verification:"
    git log --oneline --all --grep="verification\|code\|token" -n 5 2>/dev/null || echo "   (no matching commits found)"
    
    echo ""
    echo "Latest commit:"
    git log -1 --oneline 2>/dev/null || echo "   (git not available)"
    
    echo ""
    echo "Current branch:"
    git branch --show-current 2>/dev/null || echo "   (git not available)"
else
    echo "⚠️  Not a git repository or .git not found"
fi
echo ""

# Check 8: Test actual API endpoint
echo "[8] Testing verify_email API endpoint..."
echo "Checking if endpoint accepts 'code' parameter..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/verify-email/ \
    -H "Content-Type: application/json" \
    -d '{"code": "TEST-123-ABC"}' 2>/dev/null || echo "ERROR")

if echo "$TEST_RESPONSE" | grep -q "required\|Invalid\|error"; then
    echo "✅ Endpoint responds (checking error message)..."
    echo "   Response: $(echo "$TEST_RESPONSE" | head -c 200)"
    
    # Check if error mentions 'code' or 'token'
    if echo "$TEST_RESPONSE" | grep -q "code"; then
        echo "✅ Error message mentions 'code' (CORRECT)"
    elif echo "$TEST_RESPONSE" | grep -q "token"; then
        echo "❌ Error message mentions 'token' (OLD CODE)"
    fi
else
    echo "⚠️  Could not test endpoint (might be rate limited or other issue)"
fi
echo ""

# Check 9: Check database for recent verification codes
echo "[9] Checking database for verification codes..."
cd "$BACKEND_DIR"
if [ -f "manage.py" ]; then
    echo "Checking recent user profiles..."
    python3 manage.py shell << 'PYTHON_EOF' 2>/dev/null | head -n 20
from users.models import UserProfile
from django.utils import timezone
from datetime import timedelta

recent = UserProfile.objects.filter(
    email_verification_sent_at__gte=timezone.now() - timedelta(days=1)
).exclude(email_verification_code__isnull=True)[:5]

print(f"Found {recent.count()} profiles with codes sent in last 24h:")
for p in recent:
    has_code = bool(p.email_verification_code)
    has_token = bool(p.email_verification_token)
    print(f"  User: {p.user.email}")
    print(f"    Code: {'✅' if has_code else '❌'} {p.email_verification_code[:20] if has_code else 'None'}")
    print(f"    Token: {'⚠️' if has_token else '✅'} {'Set' if has_token else 'None (correct)'}")
    print()
PYTHON_EOF
else
    echo "⚠️  manage.py not found, cannot check database"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary & Action Items"
echo "=========================================="
echo ""

ISSUES=0

# Count issues
if grep -q "generate_verification_token()" "$VIEWS_FILE" 2>/dev/null; then
    echo "❌ ISSUE: Backend still uses generate_verification_token()"
    echo "   Fix: Update ${BACKEND_DIR}/users/views.py"
    ISSUES=$((ISSUES + 1))
fi

if grep -q "verify-email?token=" "$VIEWS_FILE" 2>/dev/null || grep -q "verify-email?token=" "$EMAIL_FILE" 2>/dev/null; then
    echo "❌ ISSUE: Email links still use ?token="
    echo "   Fix: Update email link generation"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ All code checks passed!"
    echo ""
    echo "If verification still not working:"
    echo "1. Restart services:"
    echo "   sudo systemctl restart pagerodeo-django"
    echo "   sudo systemctl restart $SERVICE_NAME"
    echo ""
    echo "2. Check logs:"
    echo "   sudo journalctl -u pagerodeo-django -n 50"
    echo "   sudo journalctl -u $SERVICE_NAME -n 50"
    echo ""
    echo "3. Test registration flow:"
    echo "   Register a new user and check what code/token is generated"
else
    echo "❌ Found $ISSUES issue(s) that need fixing"
    echo ""
    echo "After fixing, run:"
    echo "  cd $PROJECT_ROOT"
    echo "  git pull origin main  # if changes are in git"
    echo "  sudo systemctl restart pagerodeo-django"
    echo "  sudo systemctl restart $SERVICE_NAME"
fi
echo ""

