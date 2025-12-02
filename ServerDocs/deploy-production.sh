#!/bin/bash
#
# Production Deployment Script for PageRodeo
# Deploys latest code, builds frontend, and restarts services
#
# Usage: sudo ./deploy-production.sh [--skip-build] [--logs]
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/opt/pagerodeofullstack"
STUDIO_DIR="${PROJECT_ROOT}/studio"
BACKEND_DIR="${PROJECT_ROOT}/backend"
SERVICES=("pagerodeo-nextjs" "pagerodeo-django")

# Parse arguments
SKIP_BUILD=false
SHOW_LOGS=false
for arg in "$@"; do
  case $arg in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --logs)
      SHOW_LOGS=true
      shift
      ;;
    *)
      echo -e "${YELLOW}Unknown option: $arg${NC}"
      ;;
  esac
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PageRodeo Production Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root (for systemctl)
if [ "$EUID" -ne 0 ]; then 
  echo -e "${YELLOW}Warning: Not running as root. Some commands may require sudo.${NC}"
fi

# Step 1: Navigate to project root
echo -e "${GREEN}[1/5] Navigating to project directory...${NC}"
cd "${PROJECT_ROOT}" || {
  echo -e "${RED}Error: Could not navigate to ${PROJECT_ROOT}${NC}"
  exit 1
}
echo "✓ Current directory: $(pwd)"
echo ""

# Step 2: Pull latest code
echo -e "${GREEN}[2/5] Pulling latest code from Git...${NC}"
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
LATEST_COMMIT=$(git rev-parse origin/${CURRENT_BRANCH})
CURRENT_COMMIT=$(git rev-parse HEAD)

if [ "$LATEST_COMMIT" = "$CURRENT_COMMIT" ]; then
  echo -e "${YELLOW}✓ Already up to date (commit: ${CURRENT_COMMIT:0:7})${NC}"
else
  echo "Current: ${CURRENT_COMMIT:0:7}"
  echo "Latest:  ${LATEST_COMMIT:0:7}"
  git pull origin ${CURRENT_BRANCH}
  echo -e "${GREEN}✓ Code updated${NC}"
fi
echo ""

# Step 3: Build Next.js frontend
if [ "$SKIP_BUILD" = false ]; then
  echo -e "${GREEN}[3/5] Building Next.js frontend...${NC}"
  cd "${STUDIO_DIR}" || {
    echo -e "${RED}Error: Could not navigate to ${STUDIO_DIR}${NC}"
    exit 1
  }
  
  # Install dependencies if package.json changed
  echo "Checking for dependency updates..."
  npm ci --silent || npm install --silent
  
  # Build
  echo "Building production bundle..."
  npm run build
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
  else
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
  fi
  echo ""
else
  echo -e "${YELLOW}[3/5] Skipping build (--skip-build flag)${NC}"
  echo ""
fi

# Step 4: Restart services
echo -e "${GREEN}[4/5] Restarting services...${NC}"
cd "${PROJECT_ROOT}"

for service in "${SERVICES[@]}"; do
  echo "Restarting ${service}..."
  if sudo systemctl restart "${service}"; then
    echo -e "${GREEN}✓ ${service} restarted${NC}"
  else
    echo -e "${RED}✗ Failed to restart ${service}${NC}"
    exit 1
  fi
  
  # Wait a moment for service to start
  sleep 2
  
  # Check status
  if sudo systemctl is-active --quiet "${service}"; then
    echo -e "${GREEN}  → ${service} is active${NC}"
  else
    echo -e "${RED}  → ${service} is NOT active!${NC}"
    echo "Checking status..."
    sudo systemctl status "${service}" --no-pager -l || true
  fi
done
echo ""

# Step 5: Show status
echo -e "${GREEN}[5/5] Service Status${NC}"
echo "----------------------------------------"
for service in "${SERVICES[@]}"; do
  echo ""
  echo "Service: ${service}"
  sudo systemctl status "${service}" --no-pager -l | head -n 10 || true
done
echo ""

# Show logs if requested
if [ "$SHOW_LOGS" = true ]; then
  echo -e "${GREEN}Recent logs (last 20 lines):${NC}"
  echo "----------------------------------------"
  for service in "${SERVICES[@]}"; do
    echo ""
    echo -e "${YELLOW}=== ${service} ===${NC}"
    sudo journalctl -u "${service}" -n 20 --no-pager || true
  done
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Services:"
for service in "${SERVICES[@]}"; do
  STATUS=$(sudo systemctl is-active "${service}" 2>/dev/null || echo "unknown")
  if [ "$STATUS" = "active" ]; then
    echo -e "  ${GREEN}✓${NC} ${service}: ${STATUS}"
  else
    echo -e "  ${RED}✗${NC} ${service}: ${STATUS}"
  fi
done
echo ""
echo "To view logs:"
echo "  sudo journalctl -u pagerodeo-nextjs -f"
echo "  sudo journalctl -u pagerodeo-django -f"
echo ""

