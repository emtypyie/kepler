#!/usr/bin/env bash
set -e

BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_FILE="$HOME/Library/LaunchAgents/io.emtypyie.kepler.plist"
NODE_BIN="$(which node 2>/dev/null || echo /usr/local/bin/node)"

if [ "$1" = "--remove" ]; then
  launchctl unload "$PLIST_FILE" 2>/dev/null || true
  rm -f "$PLIST_FILE"
  echo "Auto-start removed."
  exit 0
fi

mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>io.emtypyie.kepler</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$BACKEND_DIR/server.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$BACKEND_DIR</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$BACKEND_DIR/kepler.log</string>
  <key>StandardErrorPath</key>
  <string>$BACKEND_DIR/kepler.log</string>
</dict>
</plist>
EOF

launchctl load "$PLIST_FILE"
echo "Auto-start configured. Kepler backend running as launchd agent."
echo "To remove: ./macos.sh --remove"
