# Comprehensive API Testing Script for PageRodeo Production (PowerShell)
# Tests all APIs listed in API-TESTING-CHECKLIST.md

$ErrorActionPreference = "Continue"

# Configuration
$BASE_URL = "http://129.146.57.158"
$API_BASE = "$BASE_URL/api"
$ADMIN_BASE = "$BASE_URL/admin"

# Test counters
$script:PASSED = 0
$script:FAILED = 0
$script:SKIPPED = 0

# Test result storage
$script:TEST_USERNAME = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')"
$script:TEST_EMAIL = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$script:TEST_PASSWORD = "SecurePass123!"
$script:ACCESS_TOKEN = ""
$script:REFRESH_TOKEN = ""
$script:VERIFICATION_TOKEN = ""
$script:SITE_ID = ""

# Helper functions
function Write-Test {
    param([string]$Message)
    Write-Host "[TEST] $Message" -ForegroundColor Blue
}

function Write-Pass {
    param([string]$Message)
    Write-Host "✓ PASS: $Message" -ForegroundColor Green
    $script:PASSED++
}

function Write-Fail {
    param([string]$Message)
    Write-Host "✗ FAIL: $Message" -ForegroundColor Red
    $script:FAILED++
}

function Write-Skip {
    param([string]$Message)
    Write-Host "⊘ SKIP: $Message" -ForegroundColor Yellow
    $script:SKIPPED++
}

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [int]$ExpectedStatus,
        [string]$Data = $null,
        [string]$AuthToken = $null,
        [string]$Description
    )
    
    Write-Test $Description
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($AuthToken) {
        $headers["Authorization"] = "Bearer $AuthToken"
    }
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $Url -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
        }
        elseif ($Method -eq "POST") {
            $response = Invoke-WebRequest -Uri $Url -Method POST -Headers $headers -Body $Data -UseBasicParsing -ErrorAction Stop
        }
        elseif ($Method -eq "DELETE") {
            $response = Invoke-WebRequest -Uri $Url -Method DELETE -Headers $headers -UseBasicParsing -ErrorAction Stop
        }
        
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Pass "$Description (HTTP $statusCode)"
            $bodyPreview = $response.Content.Substring(0, [Math]::Min(200, $response.Content.Length))
            Write-Host $bodyPreview
            return $true
        }
        else {
            Write-Fail "$Description (Expected: $ExpectedStatus, Got: $statusCode)"
            $bodyPreview = $response.Content.Substring(0, [Math]::Min(200, $response.Content.Length))
            Write-Host "Response: $bodyPreview"
            return $false
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Pass "$Description (HTTP $statusCode)"
            return $true
        }
        else {
            Write-Fail "$Description (Expected: $ExpectedStatus, Got: $statusCode)"
            Write-Host "Error: $($_.Exception.Message)"
            return $false
        }
    }
}

# Start testing
Write-Host "========================================" -ForegroundColor Green
Write-Host "PageRodeo API Testing Script" -ForegroundColor Green
Write-Host "Base URL: $BASE_URL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# ============================================
# Health Check APIs
# ============================================
Write-Host "=== Health Check APIs ===" -ForegroundColor Yellow

Test-Endpoint -Method "GET" -Url "$API_BASE/" -ExpectedStatus 200 -Description "API Root"
Test-Endpoint -Method "GET" -Url "$API_BASE/schema/" -ExpectedStatus 200 -Description "API Schema (OpenAPI)"
Test-Endpoint -Method "GET" -Url "$API_BASE/site-settings/" -ExpectedStatus 200 -Description "Site Settings (Public)"

# ============================================
# Authentication APIs
# ============================================
Write-Host "=== Authentication APIs ===" -ForegroundColor Yellow

# 1. User Registration
Write-Test "User Registration"
$registerData = @{
    username = $script:TEST_USERNAME
    email = $script:TEST_EMAIL
    password = $script:TEST_PASSWORD
    first_name = "Test"
    last_name = "User"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "$API_BASE/register/" -Method POST -Headers @{"Content-Type"="application/json"} -Body $registerData -UseBasicParsing -ErrorAction Stop
    if ($registerResponse.StatusCode -eq 201 -or $registerResponse.StatusCode -eq 200) {
        Write-Pass "User Registration (HTTP $($registerResponse.StatusCode))"
        $registerJson = $registerResponse.Content | ConvertFrom-Json
        if ($registerJson.verification_token) {
            $script:VERIFICATION_TOKEN = $registerJson.verification_token
        }
        Write-Host $registerResponse.Content.Substring(0, [Math]::Min(200, $registerResponse.Content.Length))
    }
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Fail "User Registration (Expected: 201/200, Got: $statusCode)"
    Write-Host "Error: $($_.Exception.Message)"
}

# 2. User Login
Write-Test "User Login"
$loginData = @{
    username = $script:TEST_USERNAME
    password = $script:TEST_PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$API_BASE/token/" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginData -UseBasicParsing -ErrorAction Stop
    if ($loginResponse.StatusCode -eq 200) {
        Write-Pass "User Login (HTTP 200)"
        $loginJson = $loginResponse.Content | ConvertFrom-Json
        $script:ACCESS_TOKEN = $loginJson.access
        $script:REFRESH_TOKEN = $loginJson.refresh
        Write-Host "Token extracted: $($script:ACCESS_TOKEN.Substring(0, [Math]::Min(20, $script:ACCESS_TOKEN.Length)))..."
    }
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Fail "User Login (Expected: 200, Got: $statusCode)"
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "⚠️  Cannot continue with authenticated tests without access token" -ForegroundColor Red
    $script:SKIPPED += 20
}

# 3. Get User Info (if we have a token)
if ($script:ACCESS_TOKEN) {
    Test-Endpoint -Method "GET" -Url "$API_BASE/user-info/" -ExpectedStatus 200 -AuthToken $script:ACCESS_TOKEN -Description "Get User Info (Authenticated)"
    
    # 4. Refresh Token
    if ($script:REFRESH_TOKEN) {
        $refreshData = @{ refresh = $script:REFRESH_TOKEN } | ConvertTo-Json
        Test-Endpoint -Method "POST" -Url "$API_BASE/token/refresh/" -ExpectedStatus 200 -Data $refreshData -Description "Refresh Token"
    }
}

# ============================================
# Email Verification APIs
# ============================================
if ($script:ACCESS_TOKEN) {
    Write-Host "=== Email Verification APIs ===" -ForegroundColor Yellow
    
    $sendVerifyData = @{ email = $script:TEST_EMAIL } | ConvertTo-Json
    Test-Endpoint -Method "POST" -Url "$API_BASE/send-verification-email/" -ExpectedStatus 200 -Data $sendVerifyData -AuthToken $script:ACCESS_TOKEN -Description "Send Verification Email"
    
    $resendVerifyData = @{ email = $script:TEST_EMAIL } | ConvertTo-Json
    Test-Endpoint -Method "POST" -Url "$API_BASE/resend-verification-email/" -ExpectedStatus 200 -Data $resendVerifyData -Description "Resend Verification Email"
    
    Write-Skip "Verify Email with Token (requires token from email)"
}

# ============================================
# Monitoring APIs
# ============================================
if ($script:ACCESS_TOKEN) {
    Write-Host "=== Monitoring APIs ===" -ForegroundColor Yellow
    
    Test-Endpoint -Method "GET" -Url "$API_BASE/monitor/sites/" -ExpectedStatus 200 -AuthToken $script:ACCESS_TOKEN -Description "List Monitored Sites"
    
    # Add Monitored Site
    Write-Test "Add Monitored Site"
    $addSiteData = @{ url = "example.com" } | ConvertTo-Json
    try {
        $addSiteResponse = Invoke-WebRequest -Uri "$API_BASE/monitor/sites/" -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $script:ACCESS_TOKEN"} -Body $addSiteData -UseBasicParsing -ErrorAction Stop
        if ($addSiteResponse.StatusCode -eq 201 -or $addSiteResponse.StatusCode -eq 200) {
            Write-Pass "Add Monitored Site (HTTP $($addSiteResponse.StatusCode))"
            $addSiteJson = $addSiteResponse.Content | ConvertFrom-Json
            $script:SITE_ID = $addSiteJson.id
            Write-Host $addSiteResponse.Content.Substring(0, [Math]::Min(200, $addSiteResponse.Content.Length))
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Fail "Add Monitored Site (Expected: 201/200, Got: $statusCode)"
    }
    
    if ($script:SITE_ID) {
        Test-Endpoint -Method "GET" -Url "$API_BASE/monitor/sites/$script:SITE_ID/" -ExpectedStatus 200 -AuthToken $script:ACCESS_TOKEN -Description "Get Site Details"
        Test-Endpoint -Method "DELETE" -Url "$API_BASE/monitor/sites/$script:SITE_ID/" -ExpectedStatus 204 -AuthToken $script:ACCESS_TOKEN -Description "Delete Monitored Site"
    }
    else {
        Write-Skip "Get Site Details (no site ID)"
        Write-Skip "Delete Monitored Site (no site ID)"
    }
}
else {
    Write-Skip "Monitoring APIs (no access token)"
}

# ============================================
# Site Audit APIs
# ============================================
Write-Host "=== Site Audit APIs ===" -ForegroundColor Yellow

$auditData = @{ url = "example.com" } | ConvertTo-Json
Test-Endpoint -Method "POST" -Url "$API_BASE/analyze/" -ExpectedStatus 200 -Data $auditData -Description "Run Site Audit"

$dnsData = @{ domain = "example.com" } | ConvertTo-Json
Test-Endpoint -Method "POST" -Url "$API_BASE/dns/" -ExpectedStatus 200 -Data $dnsData -Description "DNS Analysis"

$sslData = @{ domain = "example.com" } | ConvertTo-Json
Test-Endpoint -Method "POST" -Url "$API_BASE/ssl/" -ExpectedStatus 200 -Data $sslData -Description "SSL Analysis"

$linksData = @{ url = "https://example.com" } | ConvertTo-Json
Test-Endpoint -Method "POST" -Url "$API_BASE/links/" -ExpectedStatus 200 -Data $linksData -Description "Links Analysis"

# ============================================
# Settings APIs
# ============================================
Write-Host "=== Settings APIs ===" -ForegroundColor Yellow

Test-Endpoint -Method "GET" -Url "$API_BASE/typography/presets/" -ExpectedStatus 200 -Description "Get Typography Presets"
Test-Endpoint -Method "GET" -Url "$API_BASE/typography/active/" -ExpectedStatus 200 -Description "Get Active Typography"

# ============================================
# Reports APIs
# ============================================
if ($script:ACCESS_TOKEN) {
    Write-Host "=== Reports APIs ===" -ForegroundColor Yellow
    
    Test-Endpoint -Method "GET" -Url "$API_BASE/audit-reports/" -ExpectedStatus 200 -AuthToken $script:ACCESS_TOKEN -Description "List Audit Reports"
    Write-Skip "Get Report Details (requires report ID)"
}
else {
    Write-Skip "Reports APIs (no access token)"
}

# ============================================
# Admin & Frontend URLs
# ============================================
Write-Host "=== Admin & Frontend URLs ===" -ForegroundColor Yellow

try {
    $adminResponse = Invoke-WebRequest -Uri "$ADMIN_BASE/" -UseBasicParsing -ErrorAction Stop
    if ($adminResponse.StatusCode -eq 200 -or $adminResponse.StatusCode -eq 302) {
        Write-Pass "Django Admin Login Page (HTTP $($adminResponse.StatusCode))"
    }
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 200 -or $statusCode -eq 302) {
        Write-Pass "Django Admin Login Page (HTTP $statusCode)"
    }
    else {
        Write-Fail "Django Admin Login Page (Expected: 200/302, Got: $statusCode)"
    }
}

try {
    $homeResponse = Invoke-WebRequest -Uri "$BASE_URL/" -UseBasicParsing -ErrorAction Stop
    if ($homeResponse.StatusCode -eq 200) {
        Write-Pass "Homepage (HTTP 200)"
    }
}
catch {
    Write-Fail "Homepage (Expected: 200, Got: $($_.Exception.Response.StatusCode.value__))"
}

try {
    $loginPageResponse = Invoke-WebRequest -Uri "$BASE_URL/login" -UseBasicParsing -ErrorAction Stop
    if ($loginPageResponse.StatusCode -eq 200) {
        Write-Pass "Login Page (HTTP 200)"
    }
}
catch {
    Write-Fail "Login Page (Expected: 200, Got: $($_.Exception.Response.StatusCode.value__))"
}

try {
    $registerPageResponse = Invoke-WebRequest -Uri "$BASE_URL/register" -UseBasicParsing -ErrorAction Stop
    if ($registerPageResponse.StatusCode -eq 200) {
        Write-Pass "Register Page (HTTP 200)"
    }
}
catch {
    Write-Fail "Register Page (Expected: 200, Got: $($_.Exception.Response.StatusCode.value__))"
}

try {
    $verifyPageResponse = Invoke-WebRequest -Uri "$BASE_URL/verify-email" -UseBasicParsing -ErrorAction Stop
    if ($verifyPageResponse.StatusCode -eq 200) {
        Write-Pass "Verify Email Page (HTTP 200)"
    }
}
catch {
    Write-Fail "Verify Email Page (Expected: 200, Got: $($_.Exception.Response.StatusCode.value__))"
}

# ============================================
# Error Handling Tests
# ============================================
Write-Host "=== Error Handling Tests ===" -ForegroundColor Yellow

Test-Endpoint -Method "GET" -Url "$API_BASE/user-info/" -ExpectedStatus 401 -AuthToken "invalid_token_here" -Description "Invalid Token Test"

# ============================================
# Summary
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Test Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Passed: $script:PASSED" -ForegroundColor Green
Write-Host "Failed: $script:FAILED" -ForegroundColor Red
Write-Host "Skipped: $script:SKIPPED" -ForegroundColor Yellow
Write-Host ""

$TOTAL = $script:PASSED + $script:FAILED + $script:SKIPPED
if ($script:FAILED -eq 0) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "✗ Some tests failed" -ForegroundColor Red
    exit 1
}

