# VM Deployment Commands

## Quick Deployment (All-in-One)

```bash
cd /opt/pagerodeofullstack && \
git pull origin main && \
cd backend && \
source venv/bin/activate && \
pip install -r requirements.txt && \
python manage.py migrate && \
python manage.py collectstatic --noinput && \
cd ../studio && \
npm install && \
npm run build && \
sudo systemctl restart pagerodeo-backend && \
sudo systemctl restart pagerodeo-frontend && \
sudo systemctl restart nginx && \
sudo systemctl status pagerodeo-backend && \
sudo systemctl status pagerodeo-frontend
```

---

## Step-by-Step Deployment

### 1. Navigate to Project Directory
```bash
cd /opt/pagerodeofullstack
```

### 2. Pull Latest Changes from GitHub
```bash
git pull origin main
```

### 3. Backend Setup

```bash
# Navigate to backend
cd backend

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies (if requirements changed)
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Optional: Create superuser (if needed)
# python manage.py createsuperuser

# Optional: Run management commands (if new ones added)
# python manage.py setup_permissions
# python manage.py seed_subscription_plans
# python manage.py setup_demo_accounts
```

### 4. Frontend Setup

```bash
# Navigate to frontend
cd ../studio

# Install/update dependencies
npm install

# Build production bundle
npm run build
```

### 5. Restart Services

```bash
# Restart backend service
sudo systemctl restart pagerodeo-backend

# Restart frontend service
sudo systemctl restart pagerodeo-frontend

# Restart Nginx
sudo systemctl restart nginx
```

### 6. Verify Services

```bash
# Check backend status
sudo systemctl status pagerodeo-backend

# Check frontend status
sudo systemctl status pagerodeo-frontend

# Check Nginx status
sudo systemctl status nginx

# Check backend logs (if issues)
sudo journalctl -u pagerodeo-backend -n 50 --no-pager

# Check frontend logs (if issues)
sudo journalctl -u pagerodeo-frontend -n 50 --no-pager
```

---

## Database Migrations Only

If you only need to run migrations:

```bash
cd /opt/pagerodeofullstack/backend
source venv/bin/activate
python manage.py migrate
sudo systemctl restart pagerodeo-backend
```

---

## Frontend Build Only

If you only need to rebuild frontend:

```bash
cd /opt/pagerodeofullstack/studio
npm install
npm run build
sudo systemctl restart pagerodeo-frontend
```

---

## Troubleshooting Commands

### Check if Port 8000 is in Use
```bash
sudo lsof -i :8000
# OR
sudo netstat -tulpn | grep 8000
# OR
sudo ss -tulpn | grep 8000
```

### Kill Process on Port 8000
```bash
# Find PID first, then:
sudo kill -9 <PID>

# OR kill all gunicorn processes
sudo pkill -9 gunicorn

# OR force kill port 8000
sudo fuser -k 8000/tcp
```

### Stop Services (Emergency)
```bash
sudo systemctl stop pagerodeo-backend
sudo systemctl stop pagerodeo-frontend
sudo pkill -9 gunicorn
sudo fuser -k 8000/tcp
```

### Start Services After Fix
```bash
sudo systemctl start pagerodeo-backend
sudo systemctl start pagerodeo-frontend
sudo systemctl status pagerodeo-backend
```

### View Real-Time Logs
```bash
# Backend logs (follow)
sudo journalctl -u pagerodeo-backend -f

# Frontend logs (follow)
sudo journalctl -u pagerodeo-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check Environment Variables
```bash
cd /opt/pagerodeofullstack/backend
cat .env | grep -E "CSRF_TRUSTED_ORIGINS|FRONTEND_URL|ALLOWED_HOSTS|DEBUG"
```

### Check Python/Django Version
```bash
cd /opt/pagerodeofullstack/backend
source venv/bin/activate
python --version
python manage.py --version
```

### Check Node/NPM Version
```bash
node --version
npm --version
```

---

## Management Commands (If Needed)

### Setup Permissions
```bash
cd /opt/pagerodeofullstack/backend
source venv/bin/activate
python manage.py setup_permissions
```

### Seed Subscription Plans
```bash
python manage.py seed_subscription_plans
```

### Create PayPal Plans
```bash
python manage.py create_paypal_plans
```

### Setup Demo Accounts
```bash
python manage.py setup_demo_accounts
```

### Reset Demo Passwords
```bash
python manage.py reset_demo_passwords
```

### Seed Promotional Deals
```bash
python manage.py seed_promotional_deals
```

### Create Deal PayPal Plan
```bash
python manage.py create_deal_paypal_plan <deal-slug>
```

---

## Quick Health Check

```bash
# Check all services at once
sudo systemctl status pagerodeo-backend pagerodeo-frontend nginx --no-pager

# Test backend API
curl http://localhost:8000/api/user-info/ -H "Authorization: Bearer <token>"

# Test frontend
curl http://localhost:3000

# Check disk space
df -h

# Check memory
free -h
```

---

## Rollback (If Something Goes Wrong)

```bash
# Go back to previous commit
cd /opt/pagerodeofullstack
git log --oneline -5  # See last 5 commits
git checkout <previous-commit-hash>

# Rebuild and restart
cd backend && source venv/bin/activate && python manage.py migrate && python manage.py collectstatic --noinput
cd ../studio && npm run build
sudo systemctl restart pagerodeo-backend pagerodeo-frontend
```

---

## Notes

- **Project Directory**: `/opt/pagerodeofullstack`
- **Backend Port**: `8000`
- **Frontend Port**: `3000`
- **Services**: `pagerodeo-backend`, `pagerodeo-frontend`
- **Web Server**: `nginx`

---

## One-Liner for Quick Updates

```bash
cd /opt/pagerodeofullstack && git pull && cd backend && source venv/bin/activate && python manage.py migrate && python manage.py collectstatic --noinput && cd ../studio && npm run build && sudo systemctl restart pagerodeo-backend pagerodeo-frontend nginx
```

