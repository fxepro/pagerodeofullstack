#!/bin/bash
# Test verify-email endpoint on production

echo "=========================================="
echo "Testing /api/auth/verify-email/ endpoint"
echo "=========================================="
echo ""

DOMAIN="pagerodeo.com"
ENDPOINT="https://${DOMAIN}/api/auth/verify-email/"

echo "Testing endpoint: ${ENDPOINT}"
echo ""

# Test 1: Check if endpoint exists (should return 400 Bad Request for missing token, not 404)
echo "[1] Testing endpoint availability..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{}')

if [ "$STATUS" == "400" ]; then
  echo "✅ Endpoint is active (400 = Bad Request, expected for missing token)"
elif [ "$STATUS" == "404" ]; then
  echo "❌ Endpoint not found (404)"
  echo "   → Check nginx routing configuration"
elif [ "$STATUS" == "502" ] || [ "$STATUS" == "503" ]; then
  echo "❌ Backend not reachable ($STATUS)"
  echo "   → Check if Django backend is running on port 8000"
elif [ "$STATUS" == "000" ]; then
  echo "❌ Connection failed"
  echo "   → Check DNS, SSL certificate, or firewall"
else
  echo "⚠️  Unexpected status: $STATUS"
fi

echo ""

# Test 2: Check with invalid token (should return 400)
echo "[2] Testing with invalid token..."
RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"token": "invalid-token-123"}')

echo "Response: $RESPONSE"
echo ""

# Test 3: Check with invalid code (should return 400)
echo "[3] Testing with invalid code..."
RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"code": "INV-123-ALID"}')

echo "Response: $RESPONSE"
echo ""

# Test 4: Check nginx routing
echo "[4] Checking nginx configuration..."
if [ -f "/etc/nginx/sites-available/pagerodeo" ]; then
  echo "✅ Nginx config file exists"
  if grep -q "location.*/api/auth/" /etc/nginx/sites-available/pagerodeo; then
    echo "✅ Found /api/auth/ routing rule"
    grep "location.*/api/auth/" /etc/nginx/sites-available/pagerodeo
  else
    echo "⚠️  No explicit /api/auth/ routing found"
    echo "   Checking if /api/ routes to Django..."
    if grep -q "location /api/" /etc/nginx/sites-available/pagerodeo; then
      echo "✅ Found /api/ routing rule (should catch /api/auth/)"
      grep "location /api/" /etc/nginx/sites-available/pagerodeo | head -3
    fi
  fi
else
  echo "❌ Nginx config file not found"
fi

echo ""

# Test 5: Check Django backend
echo "[5] Checking Django backend..."
if curl -s http://localhost:8000/api/auth/verify-email/ -X POST \
  -H "Content-Type: application/json" \
  -d '{}' > /dev/null 2>&1; then
  echo "✅ Django backend is responding on localhost:8000"
else
  echo "❌ Django backend not responding on localhost:8000"
  echo "   → Check if backend service is running:"
  echo "     sudo systemctl status pagerodeo-backend"
fi

echo ""
echo "=========================================="
echo "Diagnostic complete"
echo "=========================================="

