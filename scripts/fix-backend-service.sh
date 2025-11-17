#!/bin/bash
# Simple script to fix backend service with correct path

PROJECT_DIR="/opt/pagerodeofullstack"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "Fixing backend service with path: $BACKEND_DIR"

# Create backend service
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

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart pagerodeo-backend

echo "✅ Backend service fixed!"
echo "Check status: sudo systemctl status pagerodeo-backend"

