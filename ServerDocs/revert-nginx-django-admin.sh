#!/bin/bash
# Remove duplicate django-admin blocks from Nginx config

NGINX_CONFIG="/etc/nginx/sites-available/pagerodeo"

echo "Removing duplicate django-admin blocks from Nginx config..."

# Backup first
sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

# Remove all django-admin related blocks
sudo sed -i '/# Django Admin/,/^[[:space:]]*}$/d' "$NGINX_CONFIG"
sudo sed -i '/location = \/django-admin/,/^[[:space:]]*}$/d' "$NGINX_CONFIG"
sudo sed -i '/location \/django-admin\//,/^[[:space:]]*}$/d' "$NGINX_CONFIG"

# Clean up any empty lines (more than 2 consecutive)
sudo sed -i '/^$/N;/^\n$/d' "$NGINX_CONFIG"

echo "✅ Removed django-admin blocks"
echo ""
echo "Testing config..."
if sudo nginx -t; then
    echo "✅ Config is valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Config has errors - restoring backup"
    sudo cp "${NGINX_CONFIG}.backup"* "$NGINX_CONFIG"
    exit 1
fi

echo ""
echo "Current Nginx config no longer has django-admin blocks"
echo "Django admin at /django-admin/ will need to be routed through Next.js or you need to add proper routing"

