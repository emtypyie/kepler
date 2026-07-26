#!/usr/bin/env bash
set -e

BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_FILE="/etc/systemd/system/kepler.service"
NODE_BIN="$(which node 2>/dev/null || echo /usr/bin/node)"

if [ "$1" = "--remove" ]; then
  sudo systemctl stop kepler 2>/dev/null || true
  sudo systemctl disable kepler 2>/dev/null || true
  sudo rm -f "$SERVICE_FILE"
  sudo systemctl daemon-reload
  echo "Auto-start removed."
  exit 0
fi

sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Kepler Backend
After=network.target

[Service]
Type=simple
ExecStart=$NODE_BIN $BACKEND_DIR/server.js
WorkingDirectory=$BACKEND_DIR
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable kepler
sudo systemctl restart kepler
echo "Auto-start configured. Kepler backend running as systemd service."
echo "To remove: ./linux.sh --remove"
