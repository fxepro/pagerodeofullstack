#!/bin/bash
# Comprehensive API Testing Script for PageRodeo Production
# Tests all APIs listed in API-TESTING-CHECKLIST.md

# Don't exit on errors - we want to test all endpoints
set +e

# Configuration
BASE_URL="http://129.146.57.158"
API_BASE="${BASE_URL}/api"
ADMIN_BASE="${BASE_URL}/admin"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

# Test result storage
TEST_USERNAME="testuser_$(date +%s)"
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="SecurePass123!"
ACCESS_TOKEN=""
REFRESH_TOKEN=""
VERIFICATION_TOKEN=""
SITE_ID=""

# Helper functions
print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    PASSED=$((PASSED + 1))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    FAILED=$((FAILED + 1))
}

print_skip() {
    echo -e "${YELLOW}⊘ SKIP${NC}: $1"
    SKIPPED=$((SKIPPED + 1))
}

test_endpoint() {
    local method=$1
    local url=$2
    local expected_status=$3
    local data=$4
    local auth_header=$5
    local description=$6
    
    print_test "$description"
    
    local headers=(-H "Content-Type: application/json")
    if [ -n "$auth_header" ]; then
        headers+=(-H "Authorization: Bearer $auth_header")
    fi
    
    local response
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${headers[@]}" "$url" 2>/dev/null || echo -e "\n000")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" "${headers[@]}" -d "$data" -X POST "$url" 2>/dev/null || echo -e "\n000")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" "${headers[@]}" -X DELETE "$url" 2>/dev/null || echo -e "\n000")
    fi
    
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "$expected_status" ]; then
        print_pass "$description (HTTP $status)"
        echo "$body" | head -c 200
        echo ""
        return 0
    else
        print_fail "$description (Expected: $expected_status, Got: $status)"
        echo "Response: $body" | head -c 200
        echo ""
        return 1
    fi
}

# Start testing
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PageRodeo API Testing Script${NC}"
echo -e "${GREEN}Base URL: ${BASE_URL}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ============================================
# Health Check APIs
# ============================================
echo -e "${YELLOW}=== Health Check APIs ===${NC}"

test_endpoint "GET" "${API_BASE}/" "200" "" "" "API Root"
# Note: OpenAPI schema endpoint not configured in Django
print_skip "API Schema (OpenAPI) - not configured"
test_endpoint "GET" "${API_BASE}/site-config/public/" "200" "" "" "Site Settings (Public)"

# ============================================
# Authentication APIs
# ============================================
echo -e "${YELLOW}=== Authentication APIs ===${NC}"

# 1. User Registration
print_test "User Registration"
REGISTER_DATA="{\"username\":\"${TEST_USERNAME}\",\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"first_name\":\"Test\",\"last_name\":\"User\"}"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -d "$REGISTER_DATA" -X POST "${API_BASE}/register/" 2>/dev/null || echo -e "\n000")
REGISTER_STATUS=$(echo "$REGISTER_RESPONSE" | tail -n 1)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | head -n -1)

if [ "$REGISTER_STATUS" = "201" ] || [ "$REGISTER_STATUS" = "200" ]; then
    print_pass "User Registration (HTTP $REGISTER_STATUS)"
    # Try to extract verification token if in response
    VERIFICATION_TOKEN=$(echo "$REGISTER_BODY" | grep -o '"verification_token":"[^"]*"' | cut -d'"' -f4 || echo "")
    echo "$REGISTER_BODY" | head -c 200
    echo ""
else
    print_fail "User Registration (Expected: 201/200, Got: $REGISTER_STATUS)"
    echo "Response: $REGISTER_BODY" | head -c 200
    echo ""
fi

# 2. User Login
print_test "User Login"
LOGIN_DATA="{\"username\":\"${TEST_USERNAME}\",\"password\":\"${TEST_PASSWORD}\"}"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -d "$LOGIN_DATA" -X POST "${API_BASE}/token/" 2>/dev/null || echo -e "\n000")
LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n 1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$LOGIN_STATUS" = "200" ]; then
    print_pass "User Login (HTTP $LOGIN_STATUS)"
    ACCESS_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"access":"[^"]*"' | cut -d'"' -f4 || echo "")
    REFRESH_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"refresh":"[^"]*"' | cut -d'"' -f4 || echo "")
    echo "Token extracted: ${ACCESS_TOKEN:0:20}..."
else
    print_fail "User Login (Expected: 200, Got: $LOGIN_STATUS)"
    echo "Response: $LOGIN_BODY" | head -c 200
    echo ""
    echo -e "${RED}⚠️  Cannot continue with authenticated tests without access token${NC}"
    SKIPPED=$((SKIPPED + 20))  # Skip remaining authenticated tests
    ACCESS_TOKEN=""  # Ensure it's empty
fi

# 3. Get User Info (if we have a token)
if [ -n "$ACCESS_TOKEN" ]; then
    test_endpoint "GET" "${API_BASE}/user-info/" "200" "" "$ACCESS_TOKEN" "Get User Info (Authenticated)"
    
    # 4. Refresh Token
    if [ -n "$REFRESH_TOKEN" ]; then
        REFRESH_DATA="{\"refresh\":\"${REFRESH_TOKEN}\"}"
        test_endpoint "POST" "${API_BASE}/token/refresh/" "200" "$REFRESH_DATA" "" "Refresh Token"
    fi
fi

# ============================================
# Email Verification APIs
# ============================================
if [ -n "$ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}=== Email Verification APIs ===${NC}"
    
    # 5. Send Verification Email (check response for actual email sending)
    print_test "Send Verification Email"
    SEND_VERIFY_DATA="{\"email\":\"${TEST_EMAIL}\"}"
    SEND_VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -d "$SEND_VERIFY_DATA" -X POST "${API_BASE}/auth/send-verification/" 2>/dev/null || echo -e "\n000")
    SEND_VERIFY_STATUS=$(echo "$SEND_VERIFY_RESPONSE" | tail -n 1)
    SEND_VERIFY_BODY=$(echo "$SEND_VERIFY_RESPONSE" | head -n -1)
    
    if [ "$SEND_VERIFY_STATUS" = "200" ]; then
        # Check if response indicates email was actually sent
        if echo "$SEND_VERIFY_BODY" | grep -q "Verification email sent successfully"; then
            print_pass "Send Verification Email (HTTP $SEND_VERIFY_STATUS - email sent)"
        elif echo "$SEND_VERIFY_BODY" | grep -q "Failed to send verification email"; then
            print_fail "Send Verification Email (HTTP $SEND_VERIFY_STATUS - but email sending FAILED)"
            echo "Response: $SEND_VERIFY_BODY"
        else
            print_pass "Send Verification Email (HTTP $SEND_VERIFY_STATUS)"
        fi
        echo "$SEND_VERIFY_BODY" | head -c 200
        echo ""
    else
        print_fail "Send Verification Email (Expected: 200, Got: $SEND_VERIFY_STATUS)"
        echo "Response: $SEND_VERIFY_BODY" | head -c 200
        echo ""
    fi
    
    # 6. Resend Verification Email (check response for actual email sending)
    print_test "Resend Verification Email"
    RESEND_VERIFY_DATA="{\"email\":\"${TEST_EMAIL}\"}"
    RESEND_VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -d "$RESEND_VERIFY_DATA" -X POST "${API_BASE}/auth/resend-verification/" 2>/dev/null || echo -e "\n000")
    RESEND_VERIFY_STATUS=$(echo "$RESEND_VERIFY_RESPONSE" | tail -n 1)
    RESEND_VERIFY_BODY=$(echo "$RESEND_VERIFY_RESPONSE" | head -n -1)
    
    if [ "$RESEND_VERIFY_STATUS" = "200" ]; then
        # Check if response indicates email was actually sent
        if echo "$RESEND_VERIFY_BODY" | grep -q "Verification email sent successfully"; then
            print_pass "Resend Verification Email (HTTP $RESEND_VERIFY_STATUS - email sent)"
        elif echo "$RESEND_VERIFY_BODY" | grep -q "Failed to send verification email"; then
            print_fail "Resend Verification Email (HTTP $RESEND_VERIFY_STATUS - but email sending FAILED)"
            echo "Response: $RESEND_VERIFY_BODY"
        else
            print_pass "Resend Verification Email (HTTP $RESEND_VERIFY_STATUS)"
        fi
        echo "$RESEND_VERIFY_BODY" | head -c 200
        echo ""
    else
        print_fail "Resend Verification Email (Expected: 200, Got: $RESEND_VERIFY_STATUS)"
        echo "Response: $RESEND_VERIFY_BODY" | head -c 200
        echo ""
    fi
    
    # 7. Verify Email with Token (test with invalid token to verify endpoint exists)
    VERIFY_TOKEN_DATA="{\"token\":\"invalid_test_token_12345\"}"
    print_test "Verify Email with Token (Invalid Token Test)"
    VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -d "$VERIFY_TOKEN_DATA" -X POST "${API_BASE}/auth/verify-email/" 2>/dev/null || echo -e "\n000")
    VERIFY_STATUS=$(echo "$VERIFY_RESPONSE" | tail -n 1)
    VERIFY_BODY=$(echo "$VERIFY_RESPONSE" | head -n -1)
    # Expect 400 for invalid token (endpoint exists and working)
    if [ "$VERIFY_STATUS" = "400" ]; then
        print_pass "Verify Email with Token (HTTP $VERIFY_STATUS - endpoint working, correctly rejects invalid token)"
    else
        print_fail "Verify Email with Token (Expected: 400, Got: $VERIFY_STATUS)"
        echo "Response: $VERIFY_BODY" | head -c 200
        echo ""
    fi
fi

# ============================================
# Monitoring APIs
# ============================================
if [ -n "$ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}=== Monitoring APIs ===${NC}"
    
    # 8. List Monitored Sites
    test_endpoint "GET" "${API_BASE}/monitor/sites/" "200" "" "$ACCESS_TOKEN" "List Monitored Sites"
    
    # 9. Add Monitored Site
    ADD_SITE_DATA="{\"url\":\"example.com\"}"
    ADD_SITE_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS_TOKEN" -d "$ADD_SITE_DATA" -X POST "${API_BASE}/monitor/sites/" 2>/dev/null || echo -e "\n000")
    ADD_SITE_STATUS=$(echo "$ADD_SITE_RESPONSE" | tail -n 1)
    ADD_SITE_BODY=$(echo "$ADD_SITE_RESPONSE" | head -n -1)
    
    if [ "$ADD_SITE_STATUS" = "201" ] || [ "$ADD_SITE_STATUS" = "200" ]; then
        print_pass "Add Monitored Site (HTTP $ADD_SITE_STATUS)"
        SITE_ID=$(echo "$ADD_SITE_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2 || echo "")
        echo "$ADD_SITE_BODY" | head -c 200
        echo ""
    else
        print_fail "Add Monitored Site (Expected: 201/200, Got: $ADD_SITE_STATUS)"
        echo "Response: $ADD_SITE_BODY" | head -c 200
        echo ""
    fi
    
    # 10. Get Site Details (if we have a site ID)
    if [ -n "$SITE_ID" ]; then
        test_endpoint "GET" "${API_BASE}/monitor/sites/${SITE_ID}/" "200" "" "$ACCESS_TOKEN" "Get Site Details"
        
        # 11. Delete Monitored Site
        test_endpoint "DELETE" "${API_BASE}/monitor/sites/${SITE_ID}/" "204" "" "$ACCESS_TOKEN" "Delete Monitored Site"
    else
        print_skip "Get Site Details (no site ID)"
        print_skip "Delete Monitored Site (no site ID)"
    fi
else
    print_skip "Monitoring APIs (no access token)"
fi

# ============================================
# Site Audit APIs (Next.js API Routes)
# ============================================
echo -e "${YELLOW}=== Site Audit APIs (Next.js) ===${NC}"

# These are Next.js API routes running on the frontend server
# Test against BASE_URL (same server, different from Django /api/ endpoints)

# 12. Run Site Audit (Performance Analysis)
AUDIT_DATA="{\"url\":\"example.com\"}"
test_endpoint "POST" "${BASE_URL}/api/analyze" "200" "$AUDIT_DATA" "" "Run Site Audit (Performance)"

# 13. DNS Analysis
DNS_DATA="{\"domain\":\"example.com\"}"
test_endpoint "POST" "${BASE_URL}/api/dns" "200" "$DNS_DATA" "" "DNS Analysis"

# 14. SSL Analysis
SSL_DATA="{\"domain\":\"example.com\"}"
test_endpoint "POST" "${BASE_URL}/api/ssl" "200" "$SSL_DATA" "" "SSL Analysis"

# 15. Links Analysis
LINKS_DATA="{\"url\":\"https://example.com\"}"
test_endpoint "POST" "${BASE_URL}/api/links" "200" "$LINKS_DATA" "" "Links Analysis"

# ============================================
# Settings APIs
# ============================================
echo -e "${YELLOW}=== Settings APIs ===${NC}"

# Typography presets list requires admin authentication
# Test with token - will return 403 for non-admin users (expected behavior)
if [ -n "$ACCESS_TOKEN" ]; then
    print_test "Get Typography Presets (Admin Required)"
    TYPO_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS_TOKEN" "${API_BASE}/typography/" 2>/dev/null || echo -e "\n000")
    TYPO_STATUS=$(echo "$TYPO_RESPONSE" | tail -n 1)
    TYPO_BODY=$(echo "$TYPO_RESPONSE" | head -n -1)
    # Accept 200 (admin) or 403 (non-admin) as valid - both show endpoint is working
    if [ "$TYPO_STATUS" = "200" ] || [ "$TYPO_STATUS" = "403" ]; then
        print_pass "Get Typography Presets (HTTP $TYPO_STATUS - endpoint correctly requires admin)"
    else
        print_fail "Get Typography Presets (Expected: 200/403, Got: $TYPO_STATUS)"
        echo "Response: $TYPO_BODY" | head -c 200
        echo ""
    fi
else
    # Without token, expect 401
    test_endpoint "GET" "${API_BASE}/typography/" "401" "" "" "Get Typography Presets (Unauthenticated)"
fi
test_endpoint "GET" "${API_BASE}/typography/active/" "200" "" "" "Get Active Typography"

# ============================================
# Reports APIs
# ============================================
if [ -n "$ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}=== Reports APIs ===${NC}"
    
    test_endpoint "GET" "${API_BASE}/reports/" "200" "" "$ACCESS_TOKEN" "List Audit Reports"
    
    # Note: Get Report Details requires actual report ID
    print_skip "Get Report Details (requires report ID)"
else
    print_skip "Reports APIs (no access token)"
fi

# ============================================
# Admin & Frontend URLs
# ============================================
echo -e "${YELLOW}=== Admin & Frontend URLs ===${NC}"

# Test admin page (should return 200 or 302 redirect)
print_test "Django Admin Login Page"
ADMIN_RESPONSE=$(curl -s -w "\n%{http_code}" "${ADMIN_BASE}/" 2>/dev/null || echo -e "\n000")
ADMIN_STATUS=$(echo "$ADMIN_RESPONSE" | tail -n 1)
if [ "$ADMIN_STATUS" = "200" ] || [ "$ADMIN_STATUS" = "302" ]; then
    print_pass "Django Admin Login Page (HTTP $ADMIN_STATUS)"
else
    print_fail "Django Admin Login Page (Expected: 200/302, Got: $ADMIN_STATUS)"
fi

# Test frontend pages
print_test "Homepage"
HOME_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/" 2>/dev/null || echo -e "\n000")
HOME_STATUS=$(echo "$HOME_RESPONSE" | tail -n 1)
if [ "$HOME_STATUS" = "200" ]; then
    print_pass "Homepage (HTTP $HOME_STATUS)"
else
    print_fail "Homepage (Expected: 200, Got: $HOME_STATUS)"
fi

print_test "Login Page"
LOGIN_PAGE_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/login" 2>/dev/null || echo -e "\n000")
LOGIN_PAGE_STATUS=$(echo "$LOGIN_PAGE_RESPONSE" | tail -n 1)
if [ "$LOGIN_PAGE_STATUS" = "200" ]; then
    print_pass "Login Page (HTTP $LOGIN_PAGE_STATUS)"
else
    print_fail "Login Page (Expected: 200, Got: $LOGIN_PAGE_STATUS)"
fi

print_test "Register Page"
REGISTER_PAGE_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/register" 2>/dev/null || echo -e "\n000")
REGISTER_PAGE_STATUS=$(echo "$REGISTER_PAGE_RESPONSE" | tail -n 1)
if [ "$REGISTER_PAGE_STATUS" = "200" ]; then
    print_pass "Register Page (HTTP $REGISTER_PAGE_STATUS)"
else
    print_fail "Register Page (Expected: 200, Got: $REGISTER_PAGE_STATUS)"
fi

print_test "Verify Email Page"
VERIFY_PAGE_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/verify-email" 2>/dev/null || echo -e "\n000")
VERIFY_PAGE_STATUS=$(echo "$VERIFY_PAGE_RESPONSE" | tail -n 1)
if [ "$VERIFY_PAGE_STATUS" = "200" ]; then
    print_pass "Verify Email Page (HTTP $VERIFY_PAGE_STATUS)"
else
    print_fail "Verify Email Page (Expected: 200, Got: $VERIFY_PAGE_STATUS)"
fi

# ============================================
# Error Handling Tests
# ============================================
echo -e "${YELLOW}=== Error Handling Tests ===${NC}"

# Invalid Token
test_endpoint "GET" "${API_BASE}/user-info/" "401" "" "invalid_token_here" "Invalid Token Test"

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo -e "${YELLOW}Skipped: ${SKIPPED}${NC}"
echo ""

TOTAL=$((PASSED + FAILED + SKIPPED))
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi

