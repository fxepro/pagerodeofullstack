#!/bin/bash
# Quick fix script for backend startup issues after dotenv changes

echo "=========================================="
echo "Fixing Backend Startup Issues"
echo "=========================================="
echo ""

BACKEND_DIR="/opt/pagerodeofullstack/backend"

cd "$BACKEND_DIR" || {
    echo "❌ Cannot navigate to $BACKEND_DIR"
    exit 1
}

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "../venv/bin/activate" ]; then
    source ../venv/bin/activate
else
    echo "❌ Virtual environment not found"
    exit 1
fi

echo "1. Checking if python-dotenv is installed..."
if python -c "import dotenv" 2>/dev/null; then
    echo "   ✅ python-dotenv is installed"
else
    echo "   ❌ python-dotenv is NOT installed"
    echo "   Installing python-dotenv..."
    pip install python-dotenv==1.0.0
    echo "   ✅ python-dotenv installed"
fi

echo ""
echo "2. Checking if .env file exists..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
    echo "   Checking FRONTEND_URL..."
    if grep -q "FRONTEND_URL" .env; then
        echo "   ✅ FRONTEND_URL is set in .env"
    else
        echo "   ⚠️  FRONTEND_URL is NOT set in .env"
        echo "   Please add: FRONTEND_URL=https://pagerodeo.com"
    fi
else
    echo "   ❌ .env file NOT found!"
    echo "   Creating from env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "   ✅ Created .env file from env.example"
        echo "   ⚠️  Please edit .env file with production values!"
    else
        echo "   ❌ env.example not found either!"
    fi
fi

echo ""
echo "3. Testing Django settings import..."
if python -c "import os; import sys; sys.path.insert(0, '.'); os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings'); import django; django.setup(); from django.conf import settings; print('✅ Settings loaded successfully'); print('FRONTEND_URL:', settings.FRONTEND_URL)" 2>&1 | grep -q "Settings loaded successfully"; then
    echo "   ✅ Django settings can be imported"
else
    echo "   ❌ Django settings import FAILED!"
    echo "   Error output:"
    python -c "import os; import sys; sys.path.insert(0, '.'); os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings'); import django; django.setup()" 2>&1 | tail -20
    exit 1
fi

echo ""
echo "4. Restarting backend service..."
sudo systemctl restart pagerodeo-backend
sleep 3

echo ""
echo "5. Checking service status..."
if sudo systemctl is-active --quiet pagerodeo-backend; then
    echo "   ✅ Backend service is running!"
else
    echo "   ❌ Backend service is NOT running"
    echo ""
    echo "   Recent logs:"
    sudo journalctl -u pagerodeo-backend -n 30 --no-pager
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="

