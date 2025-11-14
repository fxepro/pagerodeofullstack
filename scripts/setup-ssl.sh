#!/bin/bash
# SSL Certificate Setup Script for Oracle Cloud
# Run this script after configuring Nginx

set -e

DOMAIN="${1:-yourdomain.com}"

echo "Setting up SSL certificate for domain: $DOMAIN"

# Install Certbot
if command -v yum &> /dev/null; then
    sudo yum install -y certbot python3-certbot-nginx
elif command -v apt &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
fi

# Obtain certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN

# Test auto-renewal
sudo certbot renew --dry-run

echo "SSL certificate setup complete!"
echo "Certificate will auto-renew via certbot"

