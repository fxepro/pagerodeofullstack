#!/bin/bash
# Nginx Configuration Script for Oracle Cloud
# Run this script after deploying the application

set -e

DOMAIN="${1:-yourdomain.com}"
PROJECT_DIR="/opt/pagerodeo"
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

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL certificates (will be set up by Let's Encrypt)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (Next.js)
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

    # Backend API (Django)
    location /api/ {
        proxy_pass http://django;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
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

