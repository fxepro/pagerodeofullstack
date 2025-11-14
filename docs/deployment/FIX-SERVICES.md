# Fix Systemd Services on Oracle VM

## Step 1: Find Actual Paths

```bash
# Check your current location
pwd

# Find backend directory
find /opt/pagerodeo-production -name "backend" -type d 2>/dev/null

# Find studio directory
find /opt/pagerodeo-production -name "studio" -type d 2>/dev/null

# Check if gunicorn exists
find /opt/pagerodeo-production -name "gunicorn" -type f 2>/dev/null

# Check if npm exists
which npm
```

## Step 2: Fix Backend Service

**Based on your prompt, try this:**

```bash
# Set correct paths
PROJECT_DIR="/opt/pagerodeo-production/pagerodeofullstack"
BACKEND_DIR="$PROJECT_DIR/backend"

# Check if backend exists
ls -la $BACKEND_DIR

# Check if gunicorn exists
ls -la $BACKEND_DIR/venv/bin/gunicorn

# If gunicorn doesn't exist, install it
cd $BACKEND_DIR
source venv/bin/activate
pip install gunicorn
deactivate
```

**Then update backend service:**

```bash
sudo nano /etc/systemd/system/pagerodeo-backend.service
```

**Paste this (adjust paths if needed):**

```ini
[Unit]
Description=PageRodeo Django Backend
After=network.target postgresql-14.service

[Service]
Type=simple
User=opc
WorkingDirectory=/opt/pagerodeo-production/pagerodeofullstack/backend
Environment="PATH=/opt/pagerodeo-production/pagerodeofullstack/backend/venv/bin:/usr/bin:/usr/local/bin"
ExecStart=/opt/pagerodeo-production/pagerodeofullstack/backend/venv/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8000 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

## Step 3: Fix Frontend Service

```bash
sudo nano /etc/systemd/system/pagerodeo-frontend.service
```

**Paste this (adjust paths if needed):**

```ini
[Unit]
Description=PageRodeo Next.js Frontend
After=network.target

[Service]
Type=simple
User=opc
WorkingDirectory=/opt/pagerodeo-production/pagerodeofullstack/studio
Environment="PATH=/usr/bin:/usr/local/bin"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

## Step 4: Reload and Restart

```bash
sudo systemctl daemon-reload
sudo systemctl restart pagerodeo-backend
sudo systemctl restart pagerodeo-frontend
sudo systemctl status pagerodeo-backend --no-pager
sudo systemctl status pagerodeo-frontend --no-pager
```

## Step 5: Check Logs for Errors

```bash
# Check backend logs
sudo journalctl -u pagerodeo-backend -n 50

# Check frontend logs
sudo journalctl -u pagerodeo-frontend -n 50
```

