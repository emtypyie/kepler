#!/usr/bin/env bash
set -e

REPO="emtypyie/kepler"
INSTALL_DIR="$HOME/.kepler"

echo "==> Kepler Installer"
echo ""

if command -v docker &>/dev/null; then
  echo "==> Docker detected — deploying via Docker"
  if [ ! -d "$INSTALL_DIR/repo" ]; then
    mkdir -p "$INSTALL_DIR"
    git clone --depth 1 "https://github.com/$REPO.git" "$INSTALL_DIR/repo"
  else
    cd "$INSTALL_DIR/repo" && git pull
  fi
  cd "$INSTALL_DIR/repo"
  docker compose up -d
  echo ""
  echo "  Kepler running at http://localhost:41783"
  echo "  Open https://kepler.emtypyie.in in your browser"
  echo ""
  exit 0
fi

echo "==> Docker not found — installing directly"
OS="$(uname -s)"
case "$OS" in
  Linux)   PLATFORM="linux" ;;
  Darwin)  PLATFORM="darwin" ;;
  CYGWIN*|MINGW*|MSYS*) PLATFORM="windows" ;;
  *)       echo "Unsupported OS: $OS"; exit 1 ;;
esac

if ! command -v node &>/dev/null; then
  echo "==> Node.js not found. Installing..."
  if [ "$PLATFORM" = "darwin" ]; then
    if command -v brew &>/dev/null; then
      brew install node
    else
      echo "Install Node.js from https://nodejs.org then re-run."
      exit 1
    fi
  elif [ "$PLATFORM" = "linux" ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs 2>/dev/null || yum install -y nodejs 2>/dev/null
  fi
fi
echo "   Node $(node -v)"

echo "==> Downloading Kepler Backend..."
mkdir -p "$INSTALL_DIR"
ZIP="$INSTALL_DIR/kepler-backend.zip"
curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
  | grep "browser_download_url.*kepler-backend" \
  | cut -d : -f 2,3 \
  | tr -d '" ' \
  | xargs curl -fsSL -o "$ZIP" 2>/dev/null || {
    LATEST=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep tag_name | cut -d '"' -f 4)
    curl -fsSL -o "$ZIP" "https://github.com/$REPO/releases/latest/download/kepler-backend-$LATEST.zip"
  }

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
echo "  Start: cd $INSTALL_DIR/backend && node server.js"
echo "  Open  https://kepler.emtypyie.in"
echo ""

if [ -t 0 ]; then
  read -p "Start Kepler Backend now? [Y/n] " yn
  case "$yn" in
    [Nn]*) exit 0 ;;
    *) node server.js ;;
  esac
fi
