@echo off
setlocal enabledelayedexpansion
title Kepler Setup
cd /d "%~dp0"

echo ==========================================
echo   Kepler Setup
echo ==========================================
echo.

echo [1/2] Downloading Kepler...
powershell -Command "& {$r = Invoke-RestMethod -Uri 'https://api.github.com/repos/emtypyie/kepler/releases/latest'; $a = $r.assets | Where-Object { $_.name -like '*.exe' } | Select-Object -First 1; if ($a) { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri $a.browser_download_url -OutFile '%~dp0kepler-backend.exe'; Write-Host '  Downloaded:' $a.name } else { Write-Host 'No exe found'; exit 1 }}"
if %ERRORLEVEL% NEQ 0 (
  echo   Download failed.
  pause
  exit /b 1
)
echo.

echo [2/2] Starting Kepler...
echo.
echo ==========================================
echo   Setup complete!
echo ==========================================
echo.
echo   Starting Kepler Backend...
start "" "%~dp0kepler-backend.exe"
echo   Open https://kepler.emtypyie.in in your browser
echo.
pause
