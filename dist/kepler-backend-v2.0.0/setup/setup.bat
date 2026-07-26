@echo off
title ediary Backend Setup
echo ====================================
echo   ediary Backend - Windows Setup
echo ====================================
echo.

:: Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js found

:: Install dependencies
echo Installing dependencies...
cd /d "%~dp0.."
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)

echo [OK] Dependencies installed

:: Create startup shortcut
set STARTUP_DIR="%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set SHORTCUT="%STARTUP_DIR%\ediary-backend.lnk"

echo Creating startup shortcut...
powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut(%SHORTCUT%); $SC.TargetPath = '%~dp0..\server.js'; $SC.WorkingDirectory = '%~dp0..'; $SC.WindowStyle = 7; $SC.Save()" 2>nul

echo [OK] Setup complete!
echo.
echo ediary backend will auto-start on login.
echo Start it now? (Y/N)
set /p choice=
if /i "%choice%"=="Y" (
    start "" node "%~dp0..\server.js"
    echo Backend started on http://localhost:41783
)

echo.
pause
