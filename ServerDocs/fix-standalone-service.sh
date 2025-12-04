#!/bin/bash
# Fix systemd service to use Next.js standalone build correctly
# This fixes the warning: "next start" does not work with "output: standalone"

STUDIO_DIR="/opt/pagerodeofullstack/studio"

echo "=========================================="
echo "Fixing Next.js Standalone Service"
echo "=========================================="
echo ""

# Check if standalone build exists
if [ ! -f "$STUDIO_DIR/.next/standalone/server.js" ]; then
    echo "❌ Standalone build not found!"
    echo "   Run: cd $STUDIO_DIR && npm run build"
    exit 1
fi

echo "✅ Standalone build found"
echo ""

echo "Updating service to use standalone server..."
sudo tee /etc/systemd/system/pagerodeo-frontend.service > /dev/null << SERVICE_EOF
[Unit]
Description=PageRodeo Next.js Frontend
After=network.target

[Service]
Type=simple
User=opc
Group=opc
WorkingDirectory=$STUDIO_DIR
Environment="PATH=/usr/bin:/usr/local/bin"
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE_EOF

echo "✅ Service configuration updated"
echo ""

echo "Reloading systemd..."
sudo systemctl daemon-reload
echo "✅ Systemd reloaded"
echo ""

echo "Restarting service..."
sudo systemctl restart pagerodeo-frontend
echo "✅ Service restarted"
echo ""

echo "Waiting 5 seconds for service to start..."
sleep 5
echo ""

echo "Checking service status..."
sudo systemctl status pagerodeo-frontend --no-pager -l | head -20
echo ""

echo "=========================================="
echo "✅ Service fix complete!"
echo "=========================================="
echo ""
echo "The service should now run without the standalone warning."
echo "Check logs with: sudo journalctl -u pagerodeo-frontend -f"

