#!/bin/bash
# Fix duplicate django-admin blocks in Nginx config - keep only one correct block

NGINX_CONFIG="/etc/nginx/sites-available/pagerodeo"
BACKEND_DIR="/opt/pagerodeofullstack/backend"

echo "Fixing duplicate django-admin blocks..."

# Backup
sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

# Remove ALL django-admin blocks first
sudo sed -i '/# Django Admin/,/^[[:space:]]*}$/d' "$NGINX_CONFIG"
sudo sed -i '/location = \/django-admin/,/^[[:space:]]*}$/d' "$NGINX_CONFIG"
sudo sed -i '/location \/django-admin\//,/^[[:space:]]*}$/d' "$NGINX_CONFIG"

# Find where to insert (before location /api/ or location /)
INSERT_LINE=$(sudo grep -n "location /api/" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
if [ -z "$INSERT_LINE" ]; then
    INSERT_LINE=$(sudo grep -n "location /" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
fi

if [ -n "$INSERT_LINE" ]; then
    # Insert correct single block before /api/ or /
    sudo sed -i "${INSERT_LINE}i\\
    # Django Admin - redirect /django-admin to /django-admin/\\
    location = /django-admin {\\
        return 301 /django-admin/;\\
    }\\
\\
    # Django Admin - proxy to Django backend\\
    location /django-admin/ {\\
        proxy_pass http://127.0.0.1:8000;\\
        proxy_set_header Host \$host;\\
        proxy_set_header X-Real-IP \$remote_addr;\\
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\\
        proxy_set_header X-Forwarded-Proto \$scheme;\\
    }\\
" "$NGINX_CONFIG"
    
    echo "✅ Added single correct django-admin block"
else
    echo "❌ Could not find insertion point"
    exit 1
fi

# Test and reload
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Config error - check manually"
    exit 1
fi

echo ""
echo "Fixed: Now has single django-admin block"

