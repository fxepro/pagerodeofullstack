# PageRodeo Go-Live Plan
## Complete Deployment Checklist to Make Website Live

### Status: ✅ Services Created and Enabled
- ✅ Backend service created
- ✅ Frontend service created
- ✅ Services enabled and started

---

## Phase 1: Verify Services are Running ⚙️

### Step 1.1: Check Service Status

```bash
# Check backend service
sudo systemctl status pagerodeo-backend --no-pager

# Check frontend service
sudo systemctl status pagerodeo-frontend --no-pager

# Expected: Both should show "active (running)"
```

### Step 1.2: Check Service Logs

```bash
# Check backend logs
sudo journalctl -u pagerodeo-backend -n 50

# Check frontend logs
sudo journalctl -u pagerodeo-frontend -n 50

# Look for any errors or warnings
```

### Step 1.3: Test Services Locally

```bash
# Test backend API
curl http://localhost:8000/api/health/

# Test frontend
curl http://localhost:3000

# Expected: Both should return HTTP 200 or HTML content
```

**✅ Phase 1 Complete When:**
- Both services show "active (running)"
- No critical errors in logs
- Services respond to local requests

---

## Phase 2: Install and Configure Nginx 🌐

### Step 2.1: Install Nginx (if not already installed)

```bash
# Check if Nginx is installed
sudo systemctl status nginx

# If not installed:
sudo yum install -y nginx  # Oracle Linux
# OR
sudo apt install -y nginx  # Ubuntu
```

### Step 2.2: Create Nginx Configuration

```bash
# Create Nginx config file
sudo nano /etc/nginx/conf.d/pagerodeo.conf
```

**Paste this configuration (adjust domain/IP):**

```nginx
# Upstream for Django Backend
upstream django {
    server 127.0.0.1:8000;
}

# Upstream for Next.js Frontend
upstream nextjs {
    server 127.0.0.1:3000;
}

# HTTP to HTTPS redirect (uncomment after SSL is set up)
# server {
#     listen 80;
#     server_name your-domain.com www.your-domain.com;
#     return 301 https://$server_name$request_uri;
# }

# HTTP Server (temporary - until SSL is configured)
server {
    listen 80;
    server_name _;  # Accept any domain/IP

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (Next.js)
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

    # Backend API (Django)
    location /api/ {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (if needed)
    location /static/ {
        alias /opt/pagerodeo-production/backend/staticfiles/;
    }

    # Media files (if needed)
    location /media/ {
        alias /opt/pagerodeo-production/backend/media/;
    }
}

# HTTPS Server (uncomment after SSL is set up)
# server {
#     listen 443 ssl http2;
#     server_name your-domain.com www.your-domain.com;
#
#     # SSL certificates
#     ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
#
#     # SSL configuration
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#
#     # Security headers
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
#     add_header X-Frame-Options "DENY" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#
#     # Frontend and Backend config same as above
#     # ... (copy from HTTP server block)
# }
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Step 2.3: Test Nginx Configuration

```bash
# Test Nginx config
sudo nginx -t

# Expected: "syntax is ok" and "test is successful"
```

### Step 2.4: Start/Reload Nginx

```bash
# Start Nginx if not running
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Reload Nginx configuration
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx --no-pager
```

**✅ Phase 2 Complete When:**
- Nginx is installed and running
- Configuration file created and tested
- Nginx responds on port 80

---

## Phase 3: Configure Firewall 🔥

### Step 3.1: Check Current Firewall Status

```bash
# Check if firewall is running
sudo systemctl status firewalld  # Oracle Linux/CentOS
# OR
sudo ufw status  # Ubuntu
```

### Step 3.2: Configure Firewall Rules

**For Oracle Linux/CentOS (firewalld):**

```bash
# Allow HTTP
sudo firewall-cmd --permanent --add-service=http

# Allow HTTPS
sudo firewall-cmd --permanent --add-service=https

# Allow SSH (should already be enabled)
sudo firewall-cmd --permanent --add-service=ssh

# Reload firewall
sudo firewall-cmd --reload

# Verify rules
sudo firewall-cmd --list-all
```

**For Ubuntu (ufw):**

```bash
# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow SSH (should already be enabled)
sudo ufw allow 22/tcp

# Enable firewall if not already enabled
sudo ufw enable

# Verify rules
sudo ufw status
```

**✅ Phase 3 Complete When:**
- Firewall rules allow HTTP (80) and HTTPS (443)
- Firewall is active and configured

---

## Phase 4: Test Public Access 🌍

### Step 4.1: Get Public IP Address

```bash
# Get your public IP
curl ifconfig.me

# OR check Oracle Cloud Console
# Compute → Instances → Your Instance → Public IP Address
```

### Step 4.2: Test from Local Machine

```bash
# Test HTTP access (replace with your public IP)
curl http://YOUR_PUBLIC_IP

# Test API endpoint
curl http://YOUR_PUBLIC_IP/api/health/

# Test from browser
# Open: http://YOUR_PUBLIC_IP
```

### Step 4.3: Verify All Routes Work

Test these URLs in browser or with curl:
- ✅ `http://YOUR_PUBLIC_IP/` - Frontend homepage
- ✅ `http://YOUR_PUBLIC_IP/api/health/` - Backend health check
- ✅ `http://YOUR_PUBLIC_IP/admin/` - Django admin (if configured)
- ✅ `http://YOUR_PUBLIC_IP/login` - Login page
- ✅ `http://YOUR_PUBLIC_IP/dashboard` - Dashboard (after login)

**✅ Phase 4 Complete When:**
- Website is accessible via public IP
- Frontend loads correctly
- Backend API responds
- No 502/503 errors

---

## Phase 5: Setup Domain Name (Optional) 🌐

### Step 5.1: Configure DNS

1. Go to your domain registrar
2. Add A record:
   - **Type:** A
   - **Name:** @ (or yourdomain.com)
   - **Value:** YOUR_PUBLIC_IP
   - **TTL:** 3600

3. Add CNAME record for www:
   - **Type:** CNAME
   - **Name:** www
   - **Value:** yourdomain.com
   - **TTL:** 3600

### Step 5.2: Update Nginx Configuration

```bash
# Edit Nginx config
sudo nano /etc/nginx/conf.d/pagerodeo.conf

# Change server_name from "_" to your domain:
# server_name yourdomain.com www.yourdomain.com;
```

### Step 5.3: Update Django ALLOWED_HOSTS

```bash
# Edit backend .env file
cd /opt/pagerodeo-production/backend
nano .env

# Update ALLOWED_HOSTS:
# ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,YOUR_PUBLIC_IP,localhost,127.0.0.1
```

### Step 5.4: Restart Services

```bash
# Restart backend
sudo systemctl restart pagerodeo-backend

# Reload Nginx
sudo systemctl reload nginx

# Test domain
curl http://yourdomain.com
```

**✅ Phase 5 Complete When:**
- Domain resolves to your public IP
- Website accessible via domain name
- ALLOWED_HOSTS updated

---

## Phase 6: Setup SSL Certificate (HTTPS) 🔒

### Step 6.1: Install Certbot

```bash
# For Oracle Linux/CentOS
sudo yum install -y certbot python3-certbot-nginx

# For Ubuntu
sudo apt install -y certbot python3-certbot-nginx
```

### Step 6.2: Obtain SSL Certificate

```bash
# Run Certbot (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Step 6.3: Verify SSL Certificate

```bash
# Test certificate
sudo certbot certificates

# Test HTTPS access
curl https://yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Step 6.4: Setup Auto-Renewal

```bash
# Certbot automatically creates a systemd timer
# Check it's enabled:
sudo systemctl status certbot.timer

# If not enabled:
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

**✅ Phase 6 Complete When:**
- SSL certificate installed
- HTTPS works
- HTTP redirects to HTTPS
- Auto-renewal configured

---

## Phase 7: Final Verification ✅

### Step 7.1: Complete Functionality Test

Test all features:
- ✅ Homepage loads
- ✅ User registration
- ✅ User login
- ✅ Dashboard access
- ✅ API endpoints work
- ✅ Admin panel accessible
- ✅ All pages load correctly

### Step 7.2: Performance Check

```bash
# Check service resources
sudo systemctl status pagerodeo-backend
sudo systemctl status pagerodeo-frontend

# Check Nginx status
sudo systemctl status nginx

# Monitor logs
sudo journalctl -u pagerodeo-backend -f
```

### Step 7.3: Security Verification

- ✅ HTTPS enabled
- ✅ HTTP redirects to HTTPS
- ✅ Security headers configured
- ✅ Firewall rules in place
- ✅ ALLOWED_HOSTS configured
- ✅ DEBUG=False in production
- ✅ Environment variables secure

**✅ Phase 7 Complete When:**
- All functionality works
- Performance is acceptable
- Security measures in place
- No errors in logs

---

## Phase 8: Monitoring and Maintenance 📊

### Step 8.1: Setup Log Monitoring

```bash
# View backend logs
sudo journalctl -u pagerodeo-backend -f

# View frontend logs
sudo journalctl -u pagerodeo-frontend -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Step 8.2: Setup Health Checks

Create health check script:

```bash
# Create health check script
sudo nano /opt/pagerodeo-production/health-check.sh
```

**Paste this:**

```bash
#!/bin/bash
# Health check script

# Check backend
curl -f http://localhost:8000/api/health/ || exit 1

# Check frontend
curl -f http://localhost:3000 || exit 1

# Check Nginx
curl -f http://localhost || exit 1

echo "All services healthy"
exit 0
```

```bash
# Make executable
chmod +x /opt/pagerodeo-production/health-check.sh

# Test it
/opt/pagerodeo-production/health-check.sh
```

### Step 8.3: Setup Automated Backups

```bash
# Verify backup script exists
ls -la /opt/pagerodeo-production/backend/scripts/backup-database.sh

# Make executable if needed
chmod +x /opt/pagerodeo-production/backend/scripts/backup-database.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/pagerodeo-production/backend/scripts/backup-database.sh") | crontab -

# Verify crontab
crontab -l
```

### Step 8.4: Regular Maintenance Tasks

**Daily:**
- Check service status
- Monitor logs for errors
- Check disk space: `df -h`

**Weekly:**
- Review logs
- Check backups are running
- Update packages: `sudo yum update -y`

**Monthly:**
- Review security patches
- Test backup restoration
- Review performance metrics

---

## Phase 9: Production Checklist 📋

### Pre-Launch Checklist

- [ ] All services running (backend, frontend, Nginx)
- [ ] Database configured and migrated
- [ ] Environment variables set correctly
- [ ] SSL certificate installed and working
- [ ] Domain name configured (if applicable)
- [ ] Firewall rules configured
- [ ] Security headers enabled
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS configured
- [ ] Admin user created
- [ ] Backups configured
- [ ] Logs accessible
- [ ] Monitoring in place
- [ ] Health checks working
- [ ] All features tested
- [ ] Performance acceptable
- [ ] Documentation complete

---

## Troubleshooting Guide 🔧

### Service Won't Start

```bash
# Check logs
sudo journalctl -u pagerodeo-backend -n 50
sudo journalctl -u pagerodeo-frontend -n 50

# Check service file
sudo cat /etc/systemd/system/pagerodeo-backend.service

# Verify paths exist
ls -la /opt/pagerodeo-production/backend/venv/bin/gunicorn
ls -la /opt/pagerodeo-production/studio/.next
```

### 502 Bad Gateway

- Check if services are running: `sudo systemctl status pagerodeo-backend pagerodeo-frontend`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify services respond: `curl http://localhost:8000` and `curl http://localhost:3000`

### 503 Service Unavailable

- Check service status
- Check logs for errors
- Verify database connection
- Check environment variables

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx SSL config
sudo nginx -t
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql-14

# Test connection
psql -U pagerodeo_user -d pagerodeo -h localhost

# Check .env file
cat /opt/pagerodeo-production/backend/.env | grep DB_
```

---

## Quick Reference Commands 📝

### Service Management

```bash
# Check status
sudo systemctl status pagerodeo-backend
sudo systemctl status pagerodeo-frontend
sudo systemctl status nginx

# Restart services
sudo systemctl restart pagerodeo-backend
sudo systemctl restart pagerodeo-frontend
sudo systemctl restart nginx

# View logs
sudo journalctl -u pagerodeo-backend -f
sudo journalctl -u pagerodeo-frontend -f
sudo journalctl -u nginx -f
```

### Application Management

```bash
# Pull latest code
cd /opt/pagerodeo-production
git pull origin main

# Rebuild frontend
cd studio
npm run build

# Restart backend
sudo systemctl restart pagerodeo-backend

# Run migrations
cd /opt/pagerodeo-production/backend
source venv/bin/activate
python manage.py migrate
deactivate
sudo systemctl restart pagerodeo-backend
```

### Database Management

```bash
# Backup database
cd /opt/pagerodeo-production/backend
./scripts/backup-database.sh

# Restore database
./scripts/restore-database.sh backup_file.sql
```

---

## Success Criteria 🎯

### Website is LIVE when:

1. ✅ Services are running and stable
2. ✅ Website accessible via public IP/domain
3. ✅ HTTPS working (SSL certificate installed)
4. ✅ All features functional
5. ✅ No critical errors in logs
6. ✅ Security measures in place
7. ✅ Backups configured
8. ✅ Monitoring in place
9. ✅ Performance acceptable
10. ✅ Documentation complete

---

## Next Steps After Go-Live 🚀

1. **Monitor Performance**
   - Watch logs for errors
   - Monitor resource usage
   - Track user activity

2. **Security Hardening**
   - Review security headers
   - Regular security updates
   - Monitor for vulnerabilities

3. **Performance Optimization**
   - Monitor response times
   - Optimize database queries
   - Cache frequently accessed data

4. **Backup Verification**
   - Test backup restoration
   - Verify backups are running
   - Document restoration process

5. **Documentation**
   - Update runbooks
   - Document deployment process
   - Create troubleshooting guides

---

## Support Resources 📚

- **Logs:** `/var/log/nginx/` and `journalctl -u <service>`
- **Service Files:** `/etc/systemd/system/pagerodeo-*.service`
- **Nginx Config:** `/etc/nginx/conf.d/pagerodeo.conf`
- **Application:** `/opt/pagerodeo-production/`
- **Backups:** `/opt/pagerodeo-production/backups/`

---

**Last Updated:** November 14, 2025  
**Status:** In Progress - Services Created and Enabled

