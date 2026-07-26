#!/usr/bin/env bash
set -e

REPO="emtypyie/kepler"
INSTALL_DIR="$HOME/.kepler"

echo "==> Kepler Backend Installer"
echo ""

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"
case "$OS" in
  Linux)   PLATFORM="linux" ;;
  Darwin)  PLATFORM="darwin" ;;
  CYGWIN*|MINGW*|MSYS*) PLATFORM="windows" ;;
  *)       echo "Unsupported OS: $OS"; exit 1 ;;
esac

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "==> Node.js not found. Installing..."
  if [ "$PLATFORM" = "darwin" ]; then
    if command -v brew &>/dev/null; then
      brew install node
    else
      echo "Install Node.js from https://nodejs.org then re-run this script."
      exit 1
    fi
  elif [ "$PLATFORM" = "linux" ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs 2>/dev/null || yum install -y nodejs 2>/dev/null
  else
    echo "Install Node.js from https://nodejs.org then re-run."
    exit 1
  fi
fi
echo "   Node $(node -v)"

# Download latest release
echo "==> Downloading Kepler Backend..."
mkdir -p "$INSTALL_DIR"
ZIP="$INSTALL_DIR/kepler-backend.zip"
curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
  | grep "browser_download_url.*kepler-backend" \
  | cut -d : -f 2,3 \
  | tr -d '" ' \
  | xargs curl -fsSL -o "$ZIP"

if [ ! -f "$ZIP" ]; then
  echo "Download failed. Retrying with direct URL..."
  LATEST=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep tag_name | cut -d '"' -f 4)
  curl -fsSL -o "$ZIP" "https://github.com/$REPO/releases/latest/download/kepler-backend-$LATEST.zip"
fi

echo "==> Extracting..."
rm -rf "$INSTALL_DIR/backend"
unzip -o "$ZIP" -d "$INSTALL_DIR/backend" >/dev/null 2>&1
rm "$ZIP"

cd "$INSTALL_DIR/backend"

echo "==> Installing dependencies..."
npm install --silent

echo ""
echo "============================================"
echo "  Kepler Backend installed!"
echo "============================================"
echo ""
echo "  Start the server:"
echo "    cd $INSTALL_DIR/backend && node server.js"
echo ""
echo "  Or set up auto-start (PowerShell as Admin):"
  echo "    powershell -ExecutionPolicy Bypass -File \"$INSTALL_DIR/backend/setup/windows.ps1\""
  echo ""
  echo "  Or set up auto-start (Linux):"
  echo "    sudo $INSTALL_DIR/backend/setup/linux.sh"
  echo ""
  echo "  Or set up auto-start (macOS):"
  echo "    $INSTALL_DIR/backend/setup/macos.sh"
echo ""
echo "  Open https://kepler.emtypyie.in in your browser"
echo "  to create an account and start using services."
echo ""

if [ -t 0 ]; then
  read -p "Start Kepler Backend now? [Y/n] " yn
  case "$yn" in
    [Nn]*) exit 0 ;;
    *) node server.js ;;
  esac
fi
