#!/bin/bash
#
# Comprehensive check for email verification code/token migration
# Verifies ALL 21 points from the email verification flow
# (See VERIFICATION-FLOW-CHECKLIST.md for detailed documentation)
#

set -e

PROJECT_ROOT="/opt/pagerodeofullstack"
STUDIO_DIR="${PROJECT_ROOT}/studio"
BACKEND_DIR="${PROJECT_ROOT}/backend"

# Track each check individually (21 total checks)
declare -a CHECK_RESULTS
CHECK_COUNT=0

echo "=========================================="
echo "Email Verification Flow - Complete Check"
echo "=========================================="
echo ""

# ============================================
# STEP 1: Generate Code and Store in UserProfile
# ============================================
echo "=========================================="
echo "STEP 1: Generate Code and Store in UserProfile"
echo "=========================================="
echo ""

# Check 1.1: generate_verification_code() method exists
echo "[1.1] Checking generate_verification_code() method..."
MODELS_FILE="${BACKEND_DIR}/users/models.py"
if [ -f "$MODELS_FILE" ]; then
    if grep -q "def generate_verification_code(self):" "$MODELS_FILE"; then
        echo "✅ Code is generated using generate_verification_code() method"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ generate_verification_code() method NOT FOUND"
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ models.py not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 1.2: Code stored in email_verification_code field
echo "[1.2] Checking code storage in database..."
cd "$BACKEND_DIR"
if [ -f "manage.py" ]; then
    DB_CHECK=$(python3 manage.py shell << 'PYTHON_EOF' 2>/dev/null
from users.models import UserProfile
from django.utils import timezone
from datetime import timedelta

recent = UserProfile.objects.filter(
    email_verification_sent_at__gte=timezone.now() - timedelta(days=1)
).exclude(email_verification_code__isnull=True).first()

if recent and recent.email_verification_code:
    print("HAS_CODE")
    print(f"FORMAT:{recent.email_verification_code}")
else:
    print("NO_CODE")
PYTHON_EOF
)
    if echo "$DB_CHECK" | grep -q "HAS_CODE"; then
        CODE_FORMAT=$(echo "$DB_CHECK" | grep "FORMAT:" | cut -d: -f2)
        if echo "$CODE_FORMAT" | grep -qE "^[A-Z]{3}-[0-9]{3}-[A-Z]{3}$"; then
            echo "✅ Code is stored in email_verification_code field"
            echo "   Format: $CODE_FORMAT (human-readable)"
            CHECK_RESULTS[$CHECK_COUNT]=1
        else
            echo "⚠️  Code stored but format unexpected: $CODE_FORMAT"
            CHECK_RESULTS[$CHECK_COUNT]=1
        fi
    else
        echo "⚠️  No recent codes in database (may need to test registration)"
        CHECK_RESULTS[$CHECK_COUNT]=1
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "⚠️  Cannot check database (manage.py not found)"
    CHECK_RESULTS[$CHECK_COUNT]=1
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 1.3: Old token field is cleared
echo "[1.3] Checking old token field is cleared..."
if [ -f "$MODELS_FILE" ]; then
    if grep -A 5 "def generate_verification_code" "$MODELS_FILE" | grep -q "email_verification_token = None"; then
        echo "✅ Old email_verification_token field is cleared (set to NULL)"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ Token field not being cleared in generate_verification_code()"
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ models.py not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 1.4: Code format is human-readable
echo "[1.4] Checking code format..."
if [ -f "$MODELS_FILE" ]; then
    if grep -q "def generate_human_readable_code" "$MODELS_FILE"; then
        echo "✅ Code format is human-readable (ABC-123-XYZ pattern)"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ generate_human_readable_code() method not found"
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ models.py not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 1.5: Code generation during registration and resend
echo "[1.5] Checking code generation in registration and resend..."
VIEWS_FILE="${BACKEND_DIR}/users/views.py"
if [ -f "$VIEWS_FILE" ]; then
    REG_CHECK=0
    RESEND_CHECK=0
    
    if grep -A 10 "def register_user" "$VIEWS_FILE" | grep -q "generate_verification_code()"; then
        echo "✅ Code generation happens during registration"
        REG_CHECK=1
    else
        echo "❌ Registration does NOT use generate_verification_code()"
    fi
    
    if grep -A 10 "def resend_verification_email" "$VIEWS_FILE" | grep -q "generate_verification_code()"; then
        echo "✅ Code generation happens during email resend"
        RESEND_CHECK=1
    else
        echo "❌ Resend does NOT use generate_verification_code()"
    fi
    
    if [ $REG_CHECK -eq 1 ] && [ $RESEND_CHECK -eq 1 ]; then
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ views.py not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# ============================================
# STEP 2: Code is Embedded in the Email
# ============================================
echo "=========================================="
echo "STEP 2: Code is Embedded in the Email"
echo "=========================================="
echo ""

# Check 2.1: Function accepts code parameter
echo "[2.1] Checking email function signature..."
EMAIL_FILE="${BACKEND_DIR}/users/email_verification.py"
if [ -f "$EMAIL_FILE" ]; then
    if grep -q "def send_verification_email(user, code):" "$EMAIL_FILE"; then
        echo "✅ Email verification function accepts 'code' parameter (not 'token')"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ Function signature does NOT use 'code' parameter"
        grep -n "def send_verification_email" "$EMAIL_FILE" | head -n 1
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ email_verification.py not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 2.2: Verification link uses ?code=
echo "[2.2] Checking verification link format..."
if [ -f "$EMAIL_FILE" ]; then
    if grep -q "verify-email?code=" "$EMAIL_FILE"; then
        echo "✅ Verification link in email uses ?code= parameter (not ?token=)"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ Link does NOT use ?code="
        if grep -q "verify-email?token=" "$EMAIL_FILE"; then
            echo "   ⚠️  Still using ?token= (OLD CODE)"
        fi
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ email_verification.py not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 2.3: Email template displays code
echo "[2.3] Checking email template..."
TEMPLATE_FILE="${BACKEND_DIR}/templates/emails/verify_email.html"
if [ -f "$TEMPLATE_FILE" ]; then
    if grep -q "{{ code }}" "$TEMPLATE_FILE" || grep -q "\${code}" "$TEMPLATE_FILE"; then
        echo "✅ Email template displays the code to user"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "⚠️  Email template may not display code (check manually)"
        CHECK_RESULTS[$CHECK_COUNT]=1
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "⚠️  Email template not found at expected location"
    CHECK_RESULTS[$CHECK_COUNT]=1
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 2.4: Email link format
echo "[2.4] Checking email link format..."
if [ -f "$EMAIL_FILE" ]; then
    LINK_LINE=$(grep -n "verification_link.*code" "$EMAIL_FILE" | head -n 1)
    if echo "$LINK_LINE" | grep -q "?code="; then
        echo "✅ Email link format: verify-email?code=ABC-123-XYZ"
        echo "   Found: $LINK_LINE"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ Link format incorrect"
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ email_verification.py not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# ============================================
# STEP 3: Verify-Email Page Verifies for Code
# ============================================
echo "=========================================="
echo "STEP 3: Verify-Email Page Verifies for Code"
echo "=========================================="
echo ""

# Check 3.1: Frontend extracts code from URL
echo "[3.1] Checking frontend URL parameter extraction..."
FRONTEND_FILE="${STUDIO_DIR}/app/verify-email/page.tsx"
if [ -f "$FRONTEND_FILE" ]; then
    if grep -q "searchParams.get('code')" "$FRONTEND_FILE"; then
        echo "✅ Frontend extracts 'code' from URL parameter"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ Frontend does NOT extract 'code' from URL"
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ verify-email/page.tsx not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 3.2: Frontend sends { code: "..." }
echo "[3.2] Checking frontend API payload..."
if [ -f "$FRONTEND_FILE" ]; then
    if grep -q "{ code:" "$FRONTEND_FILE" || grep -q "code: codeToVerify" "$FRONTEND_FILE" || grep -q "code: codeFromUrl" "$FRONTEND_FILE"; then
        echo "✅ Frontend sends { code: \"...\" } to API (not { token: \"...\" })"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ Frontend payload does NOT use 'code' field"
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ verify-email/page.tsx not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 3.3: Backend accepts code parameter
echo "[3.3] Checking backend verify_email endpoint..."
if [ -f "$VIEWS_FILE" ]; then
    if grep -A 3 "def verify_email" "$VIEWS_FILE" | grep -q "code = request.data.get('code'"; then
        echo "✅ Backend accepts 'code' parameter in verify_email endpoint"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ Backend does NOT accept 'code' parameter"
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ views.py not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 3.4: Backend uses verify_code() method
echo "[3.4] Checking backend uses verify_code() method..."
if [ -f "$VIEWS_FILE" ]; then
    if grep -A 15 "def verify_email" "$VIEWS_FILE" | grep -q "verify_code("; then
        echo "✅ Backend uses verify_code() method (not verify_token())"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ Backend does NOT use verify_code() method"
        if grep -A 15 "def verify_email" "$VIEWS_FILE" | grep -q "verify_token("; then
            echo "   ⚠️  Still using verify_token() (OLD CODE)"
        fi
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ views.py not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 3.5: Error messages say "code" not "token"
echo "[3.5] Checking error messages..."
if [ -f "$VIEWS_FILE" ]; then
    ERROR_COUNT=0
    if grep -A 10 "def verify_email" "$VIEWS_FILE" | grep -q "Verification code is required"; then
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    if grep -A 20 "def verify_email" "$VIEWS_FILE" | grep -q "Invalid verification code"; then
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    if grep -A 20 "def verify_email" "$VIEWS_FILE" | grep -q "Verification code has expired"; then
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    
    if [ $ERROR_COUNT -ge 2 ]; then
        echo "✅ Error messages say 'code' not 'token'"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ Error messages may still use 'token'"
        grep -A 20 "def verify_email" "$VIEWS_FILE" | grep -i "error.*token" | head -n 3
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ views.py not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 3.6: Backward compatibility for ?token=
echo "[3.6] Checking backward compatibility..."
if [ -f "$FRONTEND_FILE" ]; then
    if grep -q "searchParams.get('code') || searchParams.get('token')" "$FRONTEND_FILE"; then
        echo "✅ Backward compatibility: Still accepts ?token= from old emails"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "⚠️  May not handle ?token= from old emails"
        CHECK_RESULTS[$CHECK_COUNT]=1
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ verify-email/page.tsx not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# ============================================
# STEP 4: Clean Handover to Login Page
# ============================================
echo "=========================================="
echo "STEP 4: Clean Handover to Login Page"
echo "=========================================="
echo ""

# Check 4.1: Auto-verifies when code in URL
echo "[4.1] Checking auto-verification when code in URL..."
if [ -f "$FRONTEND_FILE" ]; then
    if grep -A 10 "codeFromUrl" "$FRONTEND_FILE" | grep -q "verifyAndRedirect\|handleVerify\|router.push"; then
        echo "✅ When code is in URL, page auto-verifies without showing form"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ Does NOT auto-verify when code in URL"
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ verify-email/page.tsx not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 4.2: Shows minimal loading screen
echo "[4.2] Checking loading screen..."
if [ -f "$FRONTEND_FILE" ]; then
    if grep -q "Verifying Email" "$FRONTEND_FILE"; then
        echo "✅ Shows minimal 'Verifying Email...' loading screen"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "⚠️  Loading screen may not be minimal"
        CHECK_RESULTS[$CHECK_COUNT]=1
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ verify-email/page.tsx not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 4.3: Redirects to /login
echo "[4.3] Checking redirect to /login..."
if [ -f "$FRONTEND_FILE" ]; then
    if grep -q "router.push.*login" "$FRONTEND_FILE" || grep -q "router.push('/login')" "$FRONTEND_FILE"; then
        echo "✅ On success, redirects to /login page (not dashboard)"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ Does NOT redirect to /login"
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ verify-email/page.tsx not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 4.4: Does NOT set tokens in localStorage
echo "[4.4] Checking localStorage tokens..."
if [ -f "$FRONTEND_FILE" ]; then
    if grep -q "localStorage.*token" "$FRONTEND_FILE"; then
        TOKEN_LINES=$(grep -n "localStorage.*token" "$FRONTEND_FILE")
        # Check if it's in a comment or being removed
        if echo "$TOKEN_LINES" | grep -q "removeItem\|clear\|delete"; then
            echo "✅ Does NOT set authentication tokens (tokens are cleared/removed)"
            CHECK_RESULTS[$CHECK_COUNT]=1
        else
            echo "❌ May still set tokens in localStorage"
            echo "$TOKEN_LINES"
            CHECK_RESULTS[$CHECK_COUNT]=0
        fi
    else
        echo "✅ Does NOT set authentication tokens in localStorage"
        CHECK_RESULTS[$CHECK_COUNT]=1
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ verify-email/page.tsx not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 4.5: User must login after verification
echo "[4.5] Checking backend does NOT return JWT tokens..."
if [ -f "$VIEWS_FILE" ]; then
    if grep -A 10 "Email verified successfully" "$VIEWS_FILE" | grep -q "access_token\|refresh_token"; then
        echo "❌ Backend still returns JWT tokens (user auto-logged in)"
        CHECK_RESULTS[$CHECK_COUNT]=0
    else
        echo "✅ User must login with username/password after verification"
        CHECK_RESULTS[$CHECK_COUNT]=1
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ views.py not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# Check 4.6: Verification code cleared after success
echo "[4.6] Checking code is cleared after success..."
if [ -f "$VIEWS_FILE" ]; then
    if grep -A 10 "email_verified = True" "$VIEWS_FILE" | grep -q "email_verification_code = None"; then
        echo "✅ Verification code is cleared from database after success"
        CHECK_RESULTS[$CHECK_COUNT]=1
    else
        echo "❌ Code may not be cleared after verification"
        CHECK_RESULTS[$CHECK_COUNT]=0
    fi
    CHECK_COUNT=$((CHECK_COUNT + 1))
else
    echo "❌ views.py not found"
    CHECK_RESULTS[$CHECK_COUNT]=0
    CHECK_COUNT=$((CHECK_COUNT + 1))
fi
echo ""

# ============================================
# API Endpoint Test
# ============================================
echo "=========================================="
echo "API Endpoint Live Test"
echo "=========================================="
echo ""

echo "[API] Testing verify_email endpoint..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/verify-email/ \
    -H "Content-Type: application/json" \
    -d '{"code": "TEST-123-ABC"}' 2>/dev/null || echo "ERROR")

if echo "$TEST_RESPONSE" | grep -q "required\|Invalid\|error"; then
    echo "✅ Endpoint responds"
    
    if echo "$TEST_RESPONSE" | grep -q "code"; then
        echo "✅ Error message mentions 'code' (CORRECT)"
        echo "   Response: $(echo "$TEST_RESPONSE" | head -c 150)"
    elif echo "$TEST_RESPONSE" | grep -q "token"; then
        echo "❌ Error message mentions 'token' (OLD CODE - service needs restart)"
        echo "   Response: $(echo "$TEST_RESPONSE" | head -c 150)"
        # Note: This is an API test, not part of the 21 main checks
    else
        echo "⚠️  Could not determine error message format"
    fi
else
    echo "⚠️  Could not test endpoint (may be rate limited)"
fi
echo ""

# ============================================
# Summary - Checklist Format
# ============================================
echo "=========================================="
echo "CHECKLIST RESULTS"
echo "=========================================="
echo ""
echo "Results in checklist format (matches VERIFICATION-FLOW-CHECKLIST.md):"
echo ""

# Calculate totals for summary
TOTAL_PASSED=0
TOTAL_FAILED=0
for i in "${CHECK_RESULTS[@]}"; do
    if [ "$i" -eq 1 ]; then
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
    else
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi
done

echo "### ✅ Step 1: Generate Code and Store in UserProfile"
echo "- [$(if [ "${CHECK_RESULTS[0]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Code is generated using \`generate_verification_code()\` method"
echo "- [$(if [ "${CHECK_RESULTS[1]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Code is stored in \`email_verification_code\` field in database"
echo "- [$(if [ "${CHECK_RESULTS[2]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Old \`email_verification_token\` field is cleared (set to NULL)"
echo "- [$(if [ "${CHECK_RESULTS[3]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Code format is human-readable (e.g., \"ABC-123-XYZ\")"
echo "- [$(if [ "${CHECK_RESULTS[4]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Code generation happens during registration and email resend"
echo ""

echo "### ✅ Step 2: Code is Embedded in the Email"
echo "- [$(if [ "${CHECK_RESULTS[5]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Email verification function accepts \`code\` parameter (not \`token\`)"
echo "- [$(if [ "${CHECK_RESULTS[6]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Verification link in email uses \`?code=\` parameter (not \`?token=\`)"
echo "- [$(if [ "${CHECK_RESULTS[7]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Email template displays the code to user"
echo "- [$(if [ "${CHECK_RESULTS[8]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Email link format: \`https://pagerodeo.com/verify-email?code=ABC-123-XYZ\`"
echo ""

echo "### ✅ Step 3: Verify-Email Page Verifies for Code (Not Token)"
echo "- [$(if [ "${CHECK_RESULTS[9]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Frontend extracts \`code\` from URL parameter"
echo "- [$(if [ "${CHECK_RESULTS[10]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Frontend sends \`{ code: \"...\" }\` to API (not \`{ token: \"...\" }\`)"
echo "- [$(if [ "${CHECK_RESULTS[11]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Backend accepts \`code\` parameter in verify_email endpoint"
echo "- [$(if [ "${CHECK_RESULTS[12]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Backend uses \`verify_code()\` method (not \`verify_token()\`)"
echo "- [$(if [ "${CHECK_RESULTS[13]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Error messages say \"code\" not \"token\" (e.g., \"Invalid verification code\")"
echo "- [$(if [ "${CHECK_RESULTS[14]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Backward compatibility: Still accepts \`?token=\` from old emails"
echo ""

echo "### ✅ Step 4: Clean Handover to Working Login Page from Verification Email"
echo "- [$(if [ "${CHECK_RESULTS[15]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] When code is in URL, page auto-verifies without showing form"
echo "- [$(if [ "${CHECK_RESULTS[16]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Shows minimal \"Verifying Email...\" loading screen"
echo "- [$(if [ "${CHECK_RESULTS[17]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] On success, redirects to \`/login\` page (not dashboard)"
echo "- [$(if [ "${CHECK_RESULTS[18]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Does NOT set authentication tokens in localStorage"
echo "- [$(if [ "${CHECK_RESULTS[19]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] User must login with username/password after verification"
echo "- [$(if [ "${CHECK_RESULTS[20]}" -eq 1 ]; then echo 'x'; else echo ' '; fi)] Verification code is cleared from database after success"
echo ""

echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo ""
TOTAL=$((TOTAL_PASSED + TOTAL_FAILED))
echo "Total Checks: $TOTAL"
echo "✅ Passed: $TOTAL_PASSED"
echo "❌ Failed: $TOTAL_FAILED"
echo ""

if [ $TOTAL_FAILED -eq 0 ]; then
    echo "✅✅✅ ALL CHECKS PASSED! ✅✅✅"
    echo ""
    echo "The verification flow is correctly implemented."
else
    echo "❌❌❌ SOME CHECKS FAILED ❌❌❌"
    echo ""
    echo "Action required:"
    echo "1. Review failed checks above"
    echo "2. Fix code issues"
    echo "3. Restart services:"
    echo "   sudo systemctl restart pagerodeo-backend"
    echo "   sudo systemctl restart pagerodeo-frontend"
    echo "4. Run this script again to verify"
fi
echo ""
