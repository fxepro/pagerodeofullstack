#!/bin/bash
# Nginx Configuration Script for Oracle Cloud
# Run this script after deploying the application

set -e

DOMAIN="${1:-yourdomain.com}"
PROJECT_DIR="/opt/pagerodeofullstack"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/studio"

echo "Configuring Nginx for domain: $DOMAIN"

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/pagerodeo > /dev/null << EOF
# Upstream for Django
upstream django {
    server 127.0.0.1:8000;
}

# Upstream for Next.js
upstream nextjs {
    server 127.0.0.1:3000;
}

# HTTP server (for IP access without SSL)
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN _;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Next.js API routes (handled by Next.js, not Django)
    # These must come BEFORE the Django /api/ catch-all
    location ~ ^/api/(analyze|analyze-device|dns|ssl|links|ai-analyze|ai-health|ai-question|monitor|typography|sitemap|test-errors) {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API (Django) - catch-all for all other /api/* routes
    location /api/ {
        proxy_pass http://django;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Frontend (Next.js) - catch-all for everything else
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://django;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files
    location /static/ {
        alias $BACKEND_DIR/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias $BACKEND_DIR/media/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/pagerodeo /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

echo "Nginx configured successfully!"
echo "Next: Setup SSL certificate with Let's Encrypt"
echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"

