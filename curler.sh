#!/usr/bin/env bash
set -e

REPO="emtypyie/kepler"
INSTALL_DIR="$HOME/.kepler/backend"

echo "==> Kepler Installer"
echo ""

if command -v docker &>/dev/null; then
  echo "==> Docker detected — deploying via Docker"
  if [ ! -d "$HOME/.kepler/repo" ]; then
    mkdir -p "$HOME/.kepler"
    git clone --depth 1 "https://github.com/$REPO.git" "$HOME/.kepler/repo"
  else
    cd "$HOME/.kepler/repo" && git pull
  fi
  cd "$HOME/.kepler/repo"
  docker compose up -d
  echo ""
  echo "  Kepler running at http://localhost:41783"
  echo "  Open https://kepler.emtypyie.in in your browser"
  echo ""
  exit 0
fi

echo "==> Docker not found — installing standalone binary"
echo ""

# Detect OS
OS="$(uname -s)"
case "$OS" in
  Linux)   PLATFORM="linux" ;;
  Darwin)  PLATFORM="macos" ;;
  CYGWIN*|MINGW*|MSYS*) PLATFORM="windows" ;;
  *)       echo "Unsupported OS: $OS"; exit 1 ;;
esac

mkdir -p "$INSTALL_DIR"

# Download appropriate binary
echo "==> Downloading Kepler Backend..."
RELEASE=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest")
if [ "$PLATFORM" = "linux" ]; then
  ASSET=$(echo "$RELEASE" | grep -o '"browser_download_url": "[^"]*\.AppImage"' | head -1 | cut -d'"' -f4)
  BIN_NAME="kepler-backend"
elif [ "$PLATFORM" = "macos" ]; then
  ASSET=$(echo "$RELEASE" | grep -o '"browser_download_url": "[^"]*macos[^"]*"' | head -1 | cut -d'"' -f4)
  BIN_NAME="kepler-backend"
else
  ASSET=$(echo "$RELEASE" | grep -o '"browser_download_url": "[^"]*\.exe"' | head -1 | cut -d'"' -f4)
  BIN_NAME="kepler-backend.exe"
fi

if [ -z "$ASSET" ]; then
  echo "  Could not find asset for $PLATFORM"
  exit 1
fi

echo "  Downloading $(basename "$ASSET")..."
curl -fsSL "$ASSET" -o "$INSTALL_DIR/$BIN_NAME"
chmod +x "$INSTALL_DIR/$BIN_NAME"

echo "==> Installing as background service..."

if [ "$PLATFORM" = "linux" ]; then
  # Create systemd user service
  mkdir -p "$HOME/.config/systemd/user"
  cat > "$HOME/.config/systemd/user/kepler.service" << EOF
[Unit]
Description=Kepler Backend
After=network.target

[Service]
Type=simple
ExecStart=$INSTALL_DIR/$BIN_NAME
WorkingDirectory=$INSTALL_DIR
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF
  systemctl --user daemon-reload
  systemctl --user enable --now kepler.service
  echo "  systemd service installed and started"

elif [ "$PLATFORM" = "macos" ]; then
  # Create launchd agent
  mkdir -p "$HOME/Library/LaunchAgents"
  cat > "$HOME/Library/LaunchAgents/com.emtypyie.kepler.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.emtypyie.kepler</string>
  <key>ProgramArguments</key>
  <array>
    <string>$INSTALL_DIR/$BIN_NAME</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$INSTALL_DIR</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$INSTALL_DIR/kepler.log</string>
  <key>StandardErrorPath</key>
  <string>$INSTALL_DIR/kepler-error.log</string>
</dict>
</plist>
EOF
  launchctl load "$HOME/Library/LaunchAgents/com.emtypyie.kepler.plist"
  echo "  launchd agent installed and started"
fi

echo ""
echo "============================================"
echo "  Kepler installed and running!" 
echo "============================================"
echo ""
echo "  Runs in background on startup"
echo "  Open https://kepler.emtypyie.in in your browser"
echo "  API: http://localhost:41783/api/health"
echo ""