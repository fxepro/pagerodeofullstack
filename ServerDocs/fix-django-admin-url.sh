#!/bin/bash
# Fix Django admin URL and Nginx routing to separate from Next.js app admin

set -e

BACKEND_DIR="/opt/pagerodeofullstack/backend"
DOMAIN=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo "=========================================="
echo "Fixing Django Admin URL Separation"
echo "=========================================="
echo ""
echo "This will:"
echo "  1. Change Django admin from /admin/ to /django-admin/"
echo "  2. Update Nginx to route /django-admin/ to Django"
echo "  3. Keep Next.js app admin at /app/admin/"
echo ""

# Step 1: Update Nginx configuration
echo "[1/3] Updating Nginx configuration..."
sudo tee /etc/nginx/sites-available/pagerodeo > /dev/null << NGINX_EOF
upstream django {
    server 127.0.0.1:8000;
    keepalive 32;
}

upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Django Admin - changed to /django-admin/ to avoid conflict
    # Redirect /django-admin (no slash) to /django-admin/ (with slash)
    location = /django-admin {
        return 301 /django-admin/;
    }
    
    # Proxy /django-admin/ to Django backend
    location /django-admin/ {
        proxy_pass http://django;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
    }

    # Next.js API Routes - These have handlers in studio/app/api/
    location ~ ^/api/(analyze|analyze-device|monitor|dns|ssl|links|sitemap|ai-analyze|ai-health|ai-question|typography|test-errors) {
        proxy_pass http://nextjs;
        include /etc/nginx/proxy_params;
    }

    # Django API Routes - Direct to Django (auth, config, etc.)
    location /api/ {
        proxy_pass http://django;
        include /etc/nginx/proxy_params;
    }

    # Next.js static assets
    location /_next/ {
        proxy_pass http://nextjs;
        include /etc/nginx/proxy_params;
    }

    # Next.js frontend (catch-all for pages including /app/admin/)
    location / {
        proxy_pass http://nextjs;
        include /etc/nginx/proxy_params;
    }

    # Django static files
    location /static/ {
        alias $BACKEND_DIR/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Django media files
    location /media/ {
        alias $BACKEND_DIR/media/;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }
}
NGINX_EOF

# Step 2: Test Nginx config
echo "[2/3] Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✓ Nginx configuration is valid"
    sudo systemctl reload nginx
    echo "✓ Nginx reloaded"
else
    echo "✗ Nginx configuration has errors!"
    exit 1
fi

# Step 3: Restart Django backend
echo "[3/3] Restarting Django backend..."
sudo systemctl restart pagerodeo-backend
echo "✓ Django backend restarted"

echo ""
echo "=========================================="
echo "✅ Django Admin URL Separation Complete"
echo "=========================================="
echo ""
echo "Django Admin: http://$DOMAIN/django-admin/"
echo "Next.js App Admin: http://$DOMAIN/admin/dashboard"
echo ""
echo "Note: Make sure you've updated backend/core/urls.py to use 'django-admin/' instead of 'admin/'"
echo "      and pushed the changes to GitHub, then pulled on the server."

