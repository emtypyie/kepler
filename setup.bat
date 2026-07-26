@echo off
setlocal enabledelayedexpansion
title Kepler Backend Setup
cd /d "%~dp0"

echo ==========================================
echo   Kepler Backend Setup
echo ==========================================
echo.

:check_node
echo [1/4] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo   Node.js not found. Downloading installer...
  powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.0.0/node-v22.0.0-x64.msi' -OutFile '%TEMP%\node-installer.msi'}"
  if !ERRORLEVEL! NEQ 0 (
    echo   Failed to download Node.js. Install manually from https://nodejs.org
    pause
    exit /b 1
  )
  echo   Installing Node.js...
  msiexec /i "%TEMP%\node-installer.msi" /quiet /norestart
  echo   Node.js installed. Please restart the setup after installation.
  pause
  exit /b
)
for /f "tokens=*" %%a in ('node -v') do set NODE_VER=%%a
echo   Found !NODE_VER!
echo.

:download
echo [2/4] Downloading Kepler Backend...
if not exist "kepler-backend" mkdir kepler-backend
cd kepler-backend

powershell -Command "& {$r = Invoke-RestMethod -Uri 'https://api.github.com/repos/emtypyie/kepler/releases/latest'; $asset = $r.assets | Where-Object { $_.name -like 'kepler-backend*.zip' } | Select-Object -First 1; if ($asset) { $url = $asset.browser_download_url; Write-Host '  Downloading:' $asset.name; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri $url -OutFile 'kepler-backend.zip' } else { Write-Host 'No release asset found'; exit 1 }}"
if %ERRORLEVEL% NEQ 0 (
  echo   Download failed. Check your internet connection.
  pause
  exit /b 1
)
echo.

:extract
echo [3/4] Extracting...
powershell -Command "& {Expand-Archive -Path 'kepler-backend.zip' -DestinationPath '.' -Force}"
del kepler-backend.zip
echo.

:install
echo [4/4] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
  echo   npm install failed.
  pause
  exit /b 1
)
echo.
echo ==========================================
echo   Setup complete!
echo ==========================================
echo.
echo   Starting Kepler Backend...
echo   Open https://kepler.emtypyie.in in your browser
echo   to create an account and start using services.
echo.
echo   Press Ctrl+C to stop the server.
echo ==========================================
echo.

node server.js

pause
