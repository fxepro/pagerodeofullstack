#!/bin/bash
# Deploy to Oracle Cloud VM - Bash Script
# Run this script on your Oracle Cloud instance

set -e

echo "=========================================="
echo "Deploying PageRodeo to Oracle Cloud VM"
echo "=========================================="

# Configuration
PROJECT_DIR="/opt/pagerodeo"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/studio"
REPO_URL="https://github.com/fxepro/pagerodeofullstack.git"
BRANCH="main"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Update system
echo -e "${YELLOW}[1/8] Updating system...${NC}"
sudo yum update -y || sudo apt update && sudo apt upgrade -y

# Step 2: Check if project directory exists
echo -e "${YELLOW}[2/8] Checking project directory...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${GREEN}✅ Project directory exists${NC}"
    cd $PROJECT_DIR
    echo -e "${YELLOW}Pulling latest changes from GitHub...${NC}"
    git pull origin $BRANCH
else
    echo -e "${YELLOW}Creating project directory and cloning repository...${NC}"
    sudo mkdir -p $PROJECT_DIR
    sudo git clone $REPO_URL $PROJECT_DIR
    sudo chown -R opc:opc $PROJECT_DIR
    cd $PROJECT_DIR
fi

# Step 3: Backend setup
echo -e "${YELLOW}[3/8] Setting up backend...${NC}"
cd $BACKEND_DIR

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3.11 -m venv venv
fi
source venv/bin/activate

# Install/upgrade dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  IMPORTANT: Edit .env file with production values before continuing${NC}"
    echo -e "${YELLOW}Run: nano $BACKEND_DIR/.env${NC}"
    read -p "Press Enter after editing .env file..."
fi

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
python manage.py migrate

# Collect static files
echo -e "${YELLOW}Collecting static files...${NC}"
python manage.py collectstatic --noinput

# Step 4: Frontend setup
echo -e "${YELLOW}[4/8] Setting up frontend...${NC}"
cd $FRONTEND_DIR

# Install dependencies
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local file not found. Creating from example...${NC}"
    cp env.example .env.local
    echo -e "${RED}⚠️  IMPORTANT: Edit .env.local file with production values before continuing${NC}"
    echo -e "${YELLOW}Run: nano $FRONTEND_DIR/.env.local${NC}"
    read -p "Press Enter after editing .env.local file..."
fi

# Build production bundle
echo -e "${YELLOW}Building production bundle...${NC}"
npm run build

# Step 5: Restart services
echo -e "${YELLOW}[5/8] Restarting services...${NC}"
sudo systemctl restart pagerodeo-backend || echo -e "${YELLOW}⚠️  Backend service not found. Create it first.${NC}"
sudo systemctl restart pagerodeo-frontend || echo -e "${YELLOW}⚠️  Frontend service not found. Create it first.${NC}"

# Step 6: Check service status
echo -e "${YELLOW}[6/8] Checking service status...${NC}"
sudo systemctl status pagerodeo-backend --no-pager || echo -e "${YELLOW}⚠️  Backend service not running${NC}"
sudo systemctl status pagerodeo-frontend --no-pager || echo -e "${YELLOW}⚠️  Frontend service not running${NC}"

# Step 7: Check Nginx
echo -e "${YELLOW}[7/8] Checking Nginx...${NC}"
sudo systemctl status nginx --no-pager || echo -e "${YELLOW}⚠️  Nginx not running. Start it with: sudo systemctl start nginx${NC}"

# Step 8: Summary
echo -e "${GREEN}=========================================="
echo -e "✅ Deployment complete!"
echo -e "==========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify services are running: sudo systemctl status pagerodeo-backend pagerodeo-frontend nginx"
echo "2. Check logs: sudo journalctl -u pagerodeo-backend -f"
echo "3. Test the application: curl http://localhost:8000/api/health/"
echo "4. Access via your domain or public IP"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "- View backend logs: sudo journalctl -u pagerodeo-backend -f"
echo "- View frontend logs: sudo journalctl -u pagerodeo-frontend -f"
echo "- Restart backend: sudo systemctl restart pagerodeo-backend"
echo "- Restart frontend: sudo systemctl restart pagerodeo-frontend"
echo "- Restart all: sudo systemctl restart pagerodeo-backend pagerodeo-frontend nginx"

