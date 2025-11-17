# Oracle Cloud Infrastructure Deployment Guide

## Overview

This guide covers deploying PageRodeo to Oracle Cloud Infrastructure (OCI).

## Prerequisites

1. Oracle Cloud account
2. OCI CLI installed and configured
3. SSH key pair for instance access
4. Domain name (optional, for custom domain)

## Architecture

### Recommended Setup

- **Compute Instance:** VM.Standard.A1.Flex (Always Free) - 1 OCPU, 6GB RAM (free tier eligible)
  - Alternative: VM.Standard.E2.1 (1 OCPU, 8GB RAM) or higher
- **Database:** PostgreSQL on Compute Instance (included with free tier)
- **Load Balancer:** OCI Load Balancer (optional, for high availability)
- **Object Storage:** For backups and static files (free tier includes 10GB)
- **VCN:** Virtual Cloud Network with security rules (included with free tier)

**Note:** VM.Standard.A1.Flex uses ARM architecture (Ampere processors). All dependencies (Python, Node.js, PostgreSQL) are compatible with ARM.

## Step 1: Create Compute Instance

### Via OCI Console

1. Navigate to **Compute** > **Instances**
2. Click **Create Instance**
3. Configure:
   - **Name:** `pagerodeo-production`
   - **Image:** Oracle Linux 8 or Ubuntu 22.04 (ARM64 compatible)
   - **Shape:** VM.Standard.A1.Flex (Always Free)
     - OCPUs: 1 (free tier)
     - Memory: 6 GB (free tier)
   - **VCN:** Create new or select existing
   - **Subnet:** Public subnet
   - **SSH Keys:** Upload your public key
4. Click **Create**

**Note:** VM.Standard.A1.Flex is Always Free-eligible and provides 1 OCPU and 6GB RAM, which is sufficient for development and small production deployments.

### Via OCI CLI

```bash
oci compute instance launch \
  --display-name pagerodeo-production \
  --availability-domain AD-1 \
  --compartment-id <compartment-ocid> \
  --image-id <image-ocid> \
  --shape VM.Standard.A1.Flex \
  --shape-config '{"ocpus": 1, "memoryInGBs": 6}' \
  --subnet-id <subnet-ocid> \
  --assign-public-ip true \
  --ssh-authorized-keys-file ~/.ssh/id_rsa.pub
```

**Note:** Use `VM.Standard.A1.Flex` for free tier, or `VM.Standard.E2.1` for paid instances.

## Step 2: Configure Security Rules

**📍 Where to Configure:** See `docs/Oracle-Cloud-Security-Rules-Setup.md` for detailed step-by-step instructions.

**Quick Path:** `OCI Console → Networking → Virtual Cloud Networks → [Your VCN] → Security Lists → [Default Security List] → Edit Ingress Rules`

### Ingress Rules (Required)

**Add these rules to your Security List:**

1. **SSH (Port 22):** ------DONE-------
   - Source Type: CIDR
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: TCP
   - Destination Port Range: `22`
   - Description: `Allow SSH access`

2. **HTTP (Port 80):** ------DONE-------
   - Source Type: CIDR
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: TCP
   - Destination Port Range: `80`
   - Description: `Allow HTTP traffic`

3. **HTTPS (Port 443):** ------DONE-------
   - Source Type: CIDR
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: TCP
   - Destination Port Range: `443`
   - Description: `Allow HTTPS traffic`

**Note:** Django (port 8000) and Next.js (port 3000) are behind Nginx reverse proxy, so they don't need public access.

### Egress Rules

**Default rule allows all outbound traffic:** ------DONE-------
- Destination Type: CIDR
- Destination CIDR: `0.0.0.0/0`
- IP Protocol: All Protocols

This rule is usually already present by default.

## Step 3: Connect to Instance

```bash
ssh opc@<instance-public-ip>
# or
ssh opc@<instance-hostname>
```

**Note:** If you get `Permission denied (publickey)` error, see `docs/Oracle-Cloud-SSH-Troubleshooting.md` for solutions.

**Common Issues:**
- **Wrong username:** Use `opc` for Oracle Linux, `ubuntu` for Ubuntu
- **SSH key not added:** Add your public key in OCI Console → Instance → Edit → SSH Keys
- **Wrong key:** Use `-i` flag to specify key: `ssh -i ~/.ssh/id_rsa opc@<ip>`

## Step 4: Install Dependencies

### Update System

```bash
# Oracle Linux
sudo yum update -y

# Ubuntu
sudo apt update && sudo apt upgrade -y
```

### Install Python 3.11+

```bash
# Oracle Linux
sudo yum install -y python3.11 python3.11-pip python3.11-devel

# Ubuntu
sudo apt install -y python3.11 python3.11-pip python3.11-venv
```

### Install Node.js 20+

```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

### Install PostgreSQL

```bash
# Oracle Linux
sudo yum install -y postgresql15-server postgresql15

# Ubuntu
sudo apt install -y postgresql-15 postgresql-contrib-15

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Nginx

```bash
# Oracle Linux / Ubuntu
sudo yum install -y nginx
# or
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 5: Setup Application

### Clone Repository

```bash
cd /opt
sudo git clone https://github.com/yourusername/pagerodeo.git
sudo chown -R opc:opc pagerodeo
cd pagerodeo
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cp env.example .env
nano .env  # Edit with production values

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser
```

### Frontend Setup

```bash
cd ../studio

# Install dependencies
npm install

# Create .env.local file
cp env.example .env.local
nano .env.local  # Edit with production values

# Build production bundle
npm run build
```

## Step 6: Configure Database

### Create Database

```bash
sudo -u postgres psql

CREATE DATABASE pagerodeo;
CREATE USER pagerodeo_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE pagerodeo TO pagerodeo_user;
\q
```

### Update .env

```bash
DB_NAME=pagerodeo
DB_USER=pagerodeo_user
DB_PASSWORD=your-secure-password
DB_HOST=localhost
DB_PORT=5432
```

## Step 7: Configure Systemd Services

### Django Service

Create `/etc/systemd/system/pagerodeo-backend.service`:

```ini
[Unit]
Description=PageRodeo Django Backend
After=network.target postgresql.service

[Service]
Type=simple
User=opc
WorkingDirectory=/opt/pagerodeo/backend
Environment="PATH=/opt/pagerodeo/backend/venv/bin"
ExecStart=/opt/pagerodeo/backend/venv/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Next.js Service

Create `/etc/systemd/system/pagerodeo-frontend.service`:

```ini
[Unit]
Description=PageRodeo Next.js Frontend
After=network.target

[Service]
Type=simple
User=opc
WorkingDirectory=/opt/pagerodeo/studio
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable pagerodeo-backend
sudo systemctl enable pagerodeo-frontend
sudo systemctl start pagerodeo-backend
sudo systemctl start pagerodeo-frontend
```

## Step 8: Configure Nginx

### Create Nginx Configuration

Create `/etc/nginx/sites-available/pagerodeo`:

```nginx
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
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Next.js API routes (handled by Next.js, not Django)
    # These must come BEFORE the Django /api/ catch-all
    location ~ ^/api/(analyze|analyze-device|dns|ssl|links|ai-analyze|ai-health|ai-question|monitor|typography|sitemap|test-errors) {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API (Django) - catch-all for all other /api/* routes
    location /api/ {
        proxy_pass http://django;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (Next.js) - catch-all for everything else
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://django;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /opt/pagerodeo/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /opt/pagerodeo/backend/media/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/pagerodeo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 9: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx
# or
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Step 10: Setup Automated Backups

### Create Backup Script

```bash
cd /opt/pagerodeo/backend
sudo chmod +x scripts/backup-database.sh
```

### Setup Cron Job

```bash
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/pagerodeo/backend/scripts/backup-database.sh /opt/pagerodeo/backups >> /opt/pagerodeo/backups/backup.log 2>&1
```

### Upload to Object Storage (Optional)

```bash
# Install OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"

# Configure OCI CLI
oci setup config

# Upload backup script
# Add to backup script:
oci os object put -bn backups-bucket --name backup_$(date +%Y%m%d_%H%M%S).dump --file /opt/pagerodeo/backups/backup_*.dump
```

## Step 11: Monitoring

### Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/pagerodeo

/opt/pagerodeo/backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 opc opc
    sharedscripts
    postrotate
        systemctl reload pagerodeo-backend
    endscript
}
```

### Setup Health Checks

Create `/opt/pagerodeo/health-check.sh`:

```bash
#!/bin/bash
# Health check script

# Check Django
curl -f http://localhost:8000/api/health/ || exit 1

# Check Next.js
curl -f http://localhost:3000/ || exit 1

# Check PostgreSQL
pg_isready -U pagerodeo_user -d pagerodeo || exit 1

exit 0
```

## Step 12: Firewall Configuration

```bash
# Oracle Linux
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

# Ubuntu
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Step 13: Environment Variables

### Production .env (Backend)

```bash
# Django Settings
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,<instance-ip>

# Database
DB_NAME=pagerodeo
DB_USER=pagerodeo_user
DB_PASSWORD=your-secure-password
DB_HOST=localhost
DB_PORT=5432

# Email
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# PostHog
POSTHOG_API_KEY=your-posthog-api-key
POSTHOG_HOST=https://app.posthog.com

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### Production .env.local (Frontend)

```bash
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-project-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

## Troubleshooting

### Check Service Status

```bash
sudo systemctl status pagerodeo-backend
sudo systemctl status pagerodeo-frontend
sudo systemctl status nginx
sudo systemctl status postgresql
```

### Check Logs

```bash
# Django logs
tail -f /opt/pagerodeo/backend/logs/app.log

# Next.js logs
journalctl -u pagerodeo-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Common Issues

1. **502 Bad Gateway:** Check if services are running
2. **Database Connection Error:** Verify PostgreSQL is running and credentials
3. **Static Files Not Loading:** Run `collectstatic` and check Nginx config
4. **SSL Certificate Issues:** Verify Certbot configuration

## Security Checklist

- [ ] Firewall configured
- [ ] SSL certificate installed
- [ ] DEBUG=False in production
- [ ] Strong SECRET_KEY set
- [ ] Database password changed
- [ ] Automated backups configured
- [ ] Log rotation configured
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Monitoring configured

## Additional Resources

- [OCI Documentation](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

