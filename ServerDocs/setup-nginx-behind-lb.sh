#!/bin/bash
# Nginx Configuration Script for Oracle Cloud - Behind Load Balancer
# This configures Nginx to work behind an OCI Load Balancer that handles SSL termination

set -e

DOMAIN="${1:-pagerodeo.com}"
PROJECT_DIR="/opt/pagerodeofullstack"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/studio"

echo "Configuring Nginx for domain: $DOMAIN (behind load balancer)"

# Get VCN CIDR from environment or use default
VCN_CIDR="${VCN_CIDR:-10.0.0.0/16}"

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/pagerodeo > /dev/null << EOF
# Upstream for Django
upstream django {
    server 127.0.0.1:8000;
    keepalive 32;
}

# Upstream for Next.js
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Single server block - load balancer handles HTTPS termination
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Trust X-Forwarded-* headers from load balancer
    # Adjust VCN_CIDR to match your actual VCN CIDR block
    set_real_ip_from $VCN_CIDR;
    real_ip_header X-Forwarded-For;
    real_ip_recursive on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Set X-Forwarded-Proto based on load balancer header
    # This ensures Django knows the original request was HTTPS
    map \$http_x_forwarded_proto \$forwarded_scheme {
        default \$http_x_forwarded_proto;
        '' http;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://django;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$forwarded_scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header Connection "";
    }

    # Next.js API Routes - must come before general /api/ block
    location /api/analyze {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$forwarded_scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header Connection "";
    }

    location /api/dns {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$forwarded_scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header Connection "";
    }

    location /api/ssl {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$forwarded_scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header Connection "";
    }

    location /api/links {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$forwarded_scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header Connection "";
    }

    # Django API Routes
    location /api/ {
        proxy_pass http://django;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$forwarded_scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header Connection "";
    }

    # Next.js static assets
    location /_next/ {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$forwarded_scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Next.js frontend
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$forwarded_scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Django static files
    location /static/ {
        alias $BACKEND_DIR/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Django media files
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
if sudo nginx -t; then
    echo "Nginx configuration is valid"
    sudo systemctl reload nginx
    echo "Nginx reloaded successfully!"
else
    echo "ERROR: Nginx configuration test failed!"
    exit 1
fi

echo ""
echo "Nginx configured for use behind load balancer!"
echo "Note: Load balancer handles HTTPS termination and HTTP->HTTPS redirect"
echo ""
echo "To use this script:"
echo "  VCN_CIDR=10.0.0.0/16 bash ServerDocs/setup-nginx-behind-lb.sh pagerodeo.com"
