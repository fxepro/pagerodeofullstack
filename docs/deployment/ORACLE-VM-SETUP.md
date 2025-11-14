# Oracle VM - Setup Systemd Services

## Step 1: Find Your Project Directory

```bash
# Check what's in /opt
cd /opt
ls -la

# Common paths:
# /opt/pagerodeo
# /opt/pagerodeo-production
# /opt/pagerodeofullstack
```

## Step 2: Create Backend Service

```bash
# Replace PROJECT_DIR with your actual path
PROJECT_DIR="/opt/pagerodeo"  # Change this to your actual path

sudo nano /etc/systemd/system/pagerodeo-backend.service
```

**Paste this content (adjust PROJECT_DIR):**

```ini
[Unit]
Description=PageRodeo Django Backend
After=network.target postgresql-14.service

[Service]
Type=simple
User=opc
WorkingDirectory=/opt/pagerodeo/backend
Environment="PATH=/opt/pagerodeo/backend/venv/bin"
ExecStart=/opt/pagerodeo/backend/venv/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8000 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

## Step 3: Create Frontend Service

```bash
sudo nano /etc/systemd/system/pagerodeo-frontend.service
```

**Paste this content (adjust PROJECT_DIR):**

```ini
[Unit]
Description=PageRodeo Next.js Frontend
After=network.target

[Service]
Type=simple
User=opc
WorkingDirectory=/opt/pagerodeo/studio
Environment="PATH=/usr/bin:/usr/local/bin"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

## Step 4: Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services (start on boot)
sudo systemctl enable pagerodeo-backend
sudo systemctl enable pagerodeo-frontend

# Start services
sudo systemctl start pagerodeo-backend
sudo systemctl start pagerodeo-frontend

# Check status
sudo systemctl status pagerodeo-backend
sudo systemctl status pagerodeo-frontend
```

## Step 5: Verify Services

```bash
# Check if services are running
sudo systemctl status pagerodeo-backend --no-pager
sudo systemctl status pagerodeo-frontend --no-pager

# Check logs if there are errors
sudo journalctl -u pagerodeo-backend -n 50
sudo journalctl -u pagerodeo-frontend -n 50

# Test if services are responding
curl http://localhost:8000/api/health/
curl http://localhost:3000
```

## Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u pagerodeo-backend -f
sudo journalctl -u pagerodeo-frontend -f

# Common issues:
# 1. Wrong path - check PROJECT_DIR in service files
# 2. Python/Node.js not found - check PATH in service files
# 3. Database not running - check PostgreSQL: sudo systemctl status postgresql-14
# 4. Permissions - check file ownership: ls -la /opt/pagerodeo
```

### Fix Paths

```bash
# Check actual paths
which python3.11
which node
which npm
which gunicorn

# Update service files with correct paths
sudo nano /etc/systemd/system/pagerodeo-backend.service
sudo nano /etc/systemd/system/pagerodeo-frontend.service

# After editing, reload:
sudo systemctl daemon-reload
sudo systemctl restart pagerodeo-backend
sudo systemctl restart pagerodeo-frontend
```

### Check PostgreSQL Service Name

```bash
# Check PostgreSQL service name (might be postgresql-14, postgresql, etc.)
sudo systemctl list-units | grep postgresql

# Update service file with correct name
sudo nano /etc/systemd/system/pagerodeo-backend.service
# Change: After=network.target postgresql-14.service
# To: After=network.target <actual-postgresql-service-name>.service
```

