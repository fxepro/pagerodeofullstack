#!/bin/bash
# Oracle Cloud Deployment Script
# Run this script on your Oracle Cloud instance after connecting via SSH

set -e

echo "=========================================="
echo "PageRodeo Oracle Cloud Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/pagerodeo"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/studio"
BACKUP_DIR="$PROJECT_DIR/backups"
REPO_URL="https://github.com/yourusername/pagerodeo-v21-fullstack-liveprep.git"

# Note: This script supports VM.Standard.A1.Flex (ARM64) - Always Free-eligible
# All dependencies are ARM64 compatible
# Optimized for free tier: 1 OCPU, 6GB RAM (using 2 Gunicorn workers)

# Step 1: Update System
echo -e "${GREEN}Step 1: Updating system...${NC}"
sudo yum update -y || sudo apt update && sudo apt upgrade -y

# Step 2: Install Python 3.11
echo -e "${GREEN}Step 2: Installing Python 3.11...${NC}"
if command -v yum &> /dev/null; then
    sudo yum install -y python3.11 python3.11-pip python3.11-devel gcc
elif command -v apt &> /dev/null; then
    sudo apt install -y python3.11 python3.11-pip python3.11-venv python3.11-dev gcc
fi

# Step 3: Install Node.js 20
echo -e "${GREEN}Step 3: Installing Node.js 20 (ARM64 compatible)...${NC}"
if command -v yum &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
elif command -v apt &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
# Note: Node.js 20+ has full ARM64 support for VM.Standard.A1.Flex

# Step 4: Install PostgreSQL
echo -e "${GREEN}Step 4: Installing PostgreSQL...${NC}"
if command -v yum &> /dev/null; then
    sudo yum install -y postgresql15-server postgresql15
    sudo postgresql-setup --initdb
elif command -v apt &> /dev/null; then
    sudo apt install -y postgresql-15 postgresql-contrib-15
fi
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Step 5: Install Nginx
echo -e "${GREEN}Step 5: Installing Nginx...${NC}"
if command -v yum &> /dev/null; then
    sudo yum install -y nginx
elif command -v apt &> /dev/null; then
    sudo apt install -y nginx
fi
sudo systemctl start nginx
sudo systemctl enable nginx

# Step 6: Install Git
echo -e "${GREEN}Step 6: Installing Git...${NC}"
if command -v yum &> /dev/null; then
    sudo yum install -y git
elif command -v apt &> /dev/null; then
    sudo apt install -y git
fi

# Step 7: Clone Repository
echo -e "${GREEN}Step 7: Cloning repository...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}Project directory already exists. Updating...${NC}"
    cd $PROJECT_DIR
    git pull
else
    sudo mkdir -p $PROJECT_DIR
    sudo git clone $REPO_URL $PROJECT_DIR
    sudo chown -R opc:opc $PROJECT_DIR
fi

# Step 8: Setup Backend
echo -e "${GREEN}Step 8: Setting up backend...${NC}"
cd $BACKEND_DIR

# Create virtual environment
if [ ! -d "venv" ]; then
    python3.11 -m venv venv
fi
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cp env.example .env
    echo -e "${YELLOW}⚠️  Please edit $BACKEND_DIR/.env with your production values${NC}"
    echo -e "${YELLOW}   Required: SECRET_KEY, DEBUG=False, ALLOWED_HOSTS, DB credentials${NC}"
    read -p "Press Enter after you've edited .env file..."
fi

# Setup database
echo -e "${GREEN}Setting up database...${NC}"
echo "Please enter database password:"
read -s DB_PASSWORD

sudo -u postgres psql << EOF
CREATE DATABASE pagerodeo;
CREATE USER pagerodeo_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE pagerodeo TO pagerodeo_user;
\q
EOF

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Step 9: Setup Frontend
echo -e "${GREEN}Step 9: Setting up frontend...${NC}"
cd $FRONTEND_DIR

# Install dependencies
npm install

# Create .env.local file if it doesn't exist
if [ ! -f ".env.local" ]; then
    cp env.example .env.local
    echo -e "${YELLOW}⚠️  Please edit $FRONTEND_DIR/.env.local with your production values${NC}"
    read -p "Press Enter after you've edited .env.local file..."
fi

# Build production bundle
npm run build

# Step 10: Create backup directory
echo -e "${GREEN}Step 10: Creating backup directory...${NC}"
mkdir -p $BACKUP_DIR
chmod +x $BACKEND_DIR/scripts/backup-database.sh

# Step 11: Setup Systemd Services
echo -e "${GREEN}Step 11: Setting up systemd services...${NC}"

# Django service
sudo tee /etc/systemd/system/pagerodeo-backend.service > /dev/null << EOF
[Unit]
Description=PageRodeo Django Backend
After=network.target postgresql.service

[Service]
Type=simple
User=opc
WorkingDirectory=$BACKEND_DIR
Environment="PATH=$BACKEND_DIR/venv/bin"
ExecStart=$BACKEND_DIR/venv/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8000 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Next.js service
sudo tee /etc/systemd/system/pagerodeo-frontend.service > /dev/null << EOF
[Unit]
Description=PageRodeo Next.js Frontend
After=network.target

[Service]
Type=simple
User=opc
WorkingDirectory=$FRONTEND_DIR
Environment="PATH=/usr/bin:/usr/local/bin"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable pagerodeo-backend
sudo systemctl enable pagerodeo-frontend
sudo systemctl start pagerodeo-backend
sudo systemctl start pagerodeo-frontend

# Step 12: Setup Nginx
echo -e "${GREEN}Step 12: Setting up Nginx...${NC}"
echo -e "${YELLOW}⚠️  Please configure Nginx manually or use the provided config${NC}"
echo -e "${YELLOW}   See: docs/Oracle-Cloud-Deployment.md for Nginx configuration${NC}"

# Step 13: Setup Automated Backups
echo -e "${GREEN}Step 13: Setting up automated backups...${NC}"
(crontab -l 2>/dev/null; echo "0 2 * * * $BACKEND_DIR/scripts/backup-database.sh $BACKUP_DIR >> $BACKUP_DIR/backup.log 2>&1") | crontab -

echo -e "${GREEN}=========================================="
echo -e "Deployment Complete!${NC}"
echo -e "${GREEN}=========================================="
echo -e ""
echo -e "Next steps:"
echo -e "1. Configure Nginx (see docs/Oracle-Cloud-Deployment.md)"
echo -e "2. Setup SSL certificate (Let's Encrypt)"
echo -e "3. Update .env and .env.local with production values"
echo -e "4. Create superuser: cd $BACKEND_DIR && python manage.py createsuperuser"
echo -e ""
echo -e "Check services:"
echo -e "  sudo systemctl status pagerodeo-backend"
echo -e "  sudo systemctl status pagerodeo-frontend"
echo -e "  sudo systemctl status nginx"
echo -e ""

