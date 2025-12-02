#!/bin/bash
#
# Fix Next.js 404 errors for static assets
# Restarts service and verifies file serving
#

set -e

PROJECT_ROOT="/opt/pagerodeofullstack"
STUDIO_DIR="${PROJECT_ROOT}/studio"

echo "=========================================="
echo "Fixing Next.js 404 Errors"
echo "=========================================="
echo ""

cd "$STUDIO_DIR"
echo "✅ Working in: $STUDIO_DIR"
echo ""

# Step 1: Check if build exists
if [ ! -d ".next" ]; then
    echo "❌ Build not found! Building now..."
    npm run build
    echo "✅ Build complete"
else
    echo "✅ Build directory exists"
fi
echo ""

# Step 2: Verify key files exist
echo "[2] Checking for key build files..."
MISSING_FILES=0

# Check for common Next.js build files
if [ -f ".next/static/chunks/main-app.js" ] || find .next/static -name "*main-app*.js" -type f | grep -q .; then
    echo "✅ main-app.js found"
else
    echo "⚠️  main-app.js not found in expected location"
    echo "   Searching..."
    find .next/static -name "*main*.js" -type f | head -n 3
    MISSING_FILES=1
fi

if [ -f ".next/static/chunks/app-pages-internals.js" ] || find .next/static -name "*app-pages-internals*.js" -type f | grep -q .; then
    echo "✅ app-pages-internals.js found"
else
    echo "⚠️  app-pages-internals.js not found in expected location"
    find .next/static -name "*internals*.js" -type f | head -n 3
    MISSING_FILES=1
fi

if find .next/static -name "layout.css" -type f | grep -q .; then
    echo "✅ layout.css found"
else
    echo "⚠️  layout.css not found"
    find .next/static -name "*.css" -type f | head -n 3
    MISSING_FILES=1
fi
echo ""

# Step 3: Check build timestamp
if [ -d ".next" ]; then
    BUILD_TIME=$(stat -c %y .next 2>/dev/null || stat -f "%Sm" .next 2>/dev/null || echo "unknown")
    echo "[3] Build timestamp: $BUILD_TIME"
    
    # Check if build is recent (within last hour)
    if [ "$MISSING_FILES" -eq 1 ]; then
        echo "⚠️  Some files missing - rebuilding..."
        rm -rf .next
        npm run build
        echo "✅ Rebuild complete"
    fi
fi
echo ""

# Step 4: Restart Next.js service
echo "[4] Restarting Next.js service..."
if systemctl is-active --quiet pagerodeo-frontend 2>/dev/null; then
    SERVICE_NAME="pagerodeo-frontend"
elif systemctl is-active --quiet pagerodeo-nextjs 2>/dev/null; then
    SERVICE_NAME="pagerodeo-nextjs"
else
    echo "❌ No Next.js service found!"
    exit 1
fi

echo "Restarting $SERVICE_NAME..."
sudo systemctl restart "$SERVICE_NAME"
echo "✅ Service restarted"
echo ""

# Step 5: Wait for service to start
echo "[5] Waiting for service to start..."
sleep 3

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ Service is active"
else
    echo "❌ Service failed to start!"
    echo "Checking logs..."
    sudo journalctl -u "$SERVICE_NAME" -n 20 --no-pager
    exit 1
fi
echo ""

# Step 6: Test file serving
echo "[6] Testing file serving..."
echo "Testing /_next/static/..."

# Get a sample chunk file
SAMPLE_FILE=$(find .next/static/chunks -name "*.js" -type f | head -n 1)
if [ -n "$SAMPLE_FILE" ]; then
    # Extract relative path from .next/static
    REL_PATH=$(echo "$SAMPLE_FILE" | sed 's|.*\.next/static/|/_next/static/|')
    echo "Testing: $REL_PATH"
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$REL_PATH" 2>/dev/null || echo "000")
    if [ "$RESPONSE" = "200" ]; then
        echo "✅ File serving works (HTTP $RESPONSE)"
    else
        echo "❌ File serving failed (HTTP $RESPONSE)"
        echo "   This might indicate a routing issue"
    fi
else
    echo "⚠️  No sample file found to test"
fi
echo ""

# Step 7: Check nginx proxy
echo "[7] Verifying nginx configuration..."
if grep -q "location /_next/" /etc/nginx/sites-available/pagerodeo; then
    echo "✅ Nginx /_next/ location exists"
    
    # Test nginx config
    if sudo nginx -t 2>/dev/null; then
        echo "✅ Nginx config is valid"
        echo "Reloading nginx..."
        sudo systemctl reload nginx
        echo "✅ Nginx reloaded"
    else
        echo "❌ Nginx config has errors!"
        sudo nginx -t
    fi
else
    echo "❌ Nginx missing /_next/ location!"
fi
echo ""

echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "If 404 errors persist:"
echo "1. Check browser console for exact file paths being requested"
echo "2. Verify the paths match what's in .next/static/"
echo "3. Check nginx access logs: sudo tail -f /var/log/nginx/access.log"
echo "4. Check Next.js logs: sudo journalctl -u $SERVICE_NAME -f"
echo ""

