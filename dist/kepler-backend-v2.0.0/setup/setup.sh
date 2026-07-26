#!/bin/bash
echo "===================================="
echo "  ediary Backend - Linux Setup"
echo "===================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed."
    echo "Install it: https://nodejs.org or use your package manager"
    exit 1
fi
echo "[OK] Node.js found"

# Install dependencies
cd "$(dirname "$0")/.."
echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] npm install failed"
    exit 1
fi
echo "[OK] Dependencies installed"

# Create systemd user service for auto-start
mkdir -p ~/.config/systemd/user/
cat > ~/.config/systemd/user/ediary-backend.service << EOF
[Unit]
Description=ediary Backend
After=network.target

[Service]
Type=simple
ExecStart=$(which node) $(pwd)/server.js
WorkingDirectory=$(pwd)
Restart=on-failure

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable ediary-backend.service

echo "[OK] Auto-start service installed"
echo ""
echo "Start backend now? (y/N)"
read -r choice
if [ "$choice" = "y" ] || [ "$choice" = "Y" ]; then
    systemctl --user start ediary-backend.service
    echo "Backend started on http://localhost:41783"
fi

echo ""
echo "Setup complete!"
