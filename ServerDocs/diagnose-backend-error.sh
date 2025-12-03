#!/bin/bash
# Diagnostic script to find backend startup error

echo "=========================================="
echo "Backend Startup Diagnostic"
echo "=========================================="
echo ""

BACKEND_DIR="/opt/pagerodeofullstack/backend"
cd "$BACKEND_DIR" || exit 1

# Activate venv
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found at venv/bin/activate"
    exit 1
fi

echo "1. Checking Python version..."
python --version
echo ""

echo "2. Checking if python-dotenv is installed..."
python -c "import dotenv; print('✅ python-dotenv is installed')" 2>&1 || echo "❌ python-dotenv is NOT installed"
echo ""

echo "3. Checking if .env file exists..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file NOT found"
fi
echo ""

echo "4. Testing Django settings import..."
python manage.py check 2>&1
echo ""

echo "5. Testing gunicorn directly..."
gunicorn core.wsgi:application --check-config 2>&1 | head -30
echo ""

echo "6. Showing recent service logs..."
sudo journalctl -u pagerodeo-backend -n 50 --no-pager 2>&1 | tail -40
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="

