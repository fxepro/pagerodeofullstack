#!/bin/bash
#
# Diagnose Next.js Build Issues
# Checks if build exists, service is running, and files are accessible
#

set -e

PROJECT_ROOT="/opt/pagerodeofullstack"
STUDIO_DIR="${PROJECT_ROOT}/studio"

echo "=========================================="
echo "Next.js Build Diagnostic"
echo "=========================================="
echo ""

# Check if studio directory exists
if [ ! -d "$STUDIO_DIR" ]; then
    echo "❌ Studio directory not found: $STUDIO_DIR"
    exit 1
fi

cd "$STUDIO_DIR"
echo "✅ Working in: $STUDIO_DIR"
echo ""

# Check 1: Is .next directory present?
echo "[1] Checking for .next build directory..."
if [ -d ".next" ]; then
    echo "✅ .next directory exists"
    
    # Check for key build files
    if [ -d ".next/static" ]; then
        echo "✅ .next/static directory exists"
        STATIC_COUNT=$(find .next/static -type f | wc -l)
        echo "   Found $STATIC_COUNT static files"
    else
        echo "❌ .next/static directory missing!"
    fi
    
    if [ -d ".next/server" ]; then
        echo "✅ .next/server directory exists"
    else
        echo "❌ .next/server directory missing!"
    fi
    
else
    echo "❌ .next directory NOT FOUND!"
    echo "   → Build has not been run. Run: npm run build"
fi
echo ""

# Check 2: Is Next.js service running?
echo "[2] Checking Next.js service status..."
if systemctl is-active --quiet pagerodeo-nextjs 2>/dev/null || systemctl is-active --quiet pagerodeo-frontend 2>/dev/null; then
    SERVICE_NAME=$(systemctl list-units --type=service --state=running | grep -E 'pagerodeo-(nextjs|frontend)' | awk '{print $1}' | head -n1)
    if [ -n "$SERVICE_NAME" ]; then
        echo "✅ Service is running: $SERVICE_NAME"
        systemctl status "$SERVICE_NAME" --no-pager -l | head -n 5
    else
        echo "⚠️  Service might be running but name unclear"
    fi
else
    echo "❌ Next.js service is NOT running!"
    echo "   → Start with: sudo systemctl start pagerodeo-nextjs"
fi
echo ""

# Check 3: Is Next.js listening on port 3000?
echo "[3] Checking if Next.js is listening on port 3000..."
if netstat -tuln 2>/dev/null | grep -q ':3000' || ss -tuln 2>/dev/null | grep -q ':3000'; then
    echo "✅ Port 3000 is in use"
    if command -v lsof >/dev/null 2>&1; then
        echo "   Process: $(lsof -ti:3000 2>/dev/null | xargs ps -p 2>/dev/null | tail -n1 || echo 'unknown')"
    fi
else
    echo "❌ Port 3000 is NOT in use!"
    echo "   → Next.js server is not running"
fi
echo ""

# Check 4: Can we access Next.js locally?
echo "[4] Testing local Next.js server..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo "✅ Next.js responds on localhost:3000"
else
    echo "❌ Next.js does NOT respond on localhost:3000"
    echo "   → Server is not running or not accessible"
fi
echo ""

# Check 5: Check nginx configuration
echo "[5] Checking nginx configuration for /_next/ route..."
if [ -f "/etc/nginx/sites-available/pagerodeo" ]; then
    if grep -q "location /_next/" /etc/nginx/sites-available/pagerodeo; then
        echo "✅ Nginx has /_next/ location block"
    else
        echo "❌ Nginx missing /_next/ location block!"
        echo "   → Need to add: location /_next/ { proxy_pass http://nextjs; }"
    fi
else
    echo "⚠️  Nginx config file not found at /etc/nginx/sites-available/pagerodeo"
fi
echo ""

# Check 6: Check package.json build script
echo "[6] Checking build configuration..."
if [ -f "package.json" ]; then
    BUILD_SCRIPT=$(grep -A1 '"build"' package.json | grep -o '".*"' | head -n1 | tr -d '"')
    echo "✅ Build script: $BUILD_SCRIPT"
else
    echo "❌ package.json not found!"
fi
echo ""

# Check 7: Check if node_modules exists
echo "[7] Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
    if [ -d "node_modules/next" ]; then
        NEXT_VERSION=$(cat node_modules/next/package.json | grep '"version"' | head -n1 | cut -d'"' -f4)
        echo "   Next.js version: $NEXT_VERSION"
    fi
else
    echo "❌ node_modules NOT FOUND!"
    echo "   → Run: npm install"
fi
echo ""

# Summary and recommendations
echo "=========================================="
echo "Summary & Recommendations"
echo "=========================================="
echo ""

if [ ! -d ".next" ]; then
    echo "🔧 ACTION REQUIRED: Build Next.js"
    echo "   cd $STUDIO_DIR"
    echo "   npm run build"
    echo ""
fi

if ! systemctl is-active --quiet pagerodeo-nextjs 2>/dev/null && ! systemctl is-active --quiet pagerodeo-frontend 2>/dev/null; then
    echo "🔧 ACTION REQUIRED: Start Next.js service"
    echo "   sudo systemctl start pagerodeo-nextjs"
    echo "   # OR"
    echo "   sudo systemctl start pagerodeo-frontend"
    echo ""
fi

if ! netstat -tuln 2>/dev/null | grep -q ':3000' && ! ss -tuln 2>/dev/null | grep -q ':3000'; then
    echo "🔧 ACTION REQUIRED: Next.js server not running"
    echo "   Check service logs: sudo journalctl -u pagerodeo-nextjs -n 50"
    echo ""
fi

echo "✅ Diagnostic complete!"

