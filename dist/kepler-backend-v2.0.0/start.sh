#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "Installing dependencies..."
npm install
echo "Starting Kepler Backend..."
node server.js
