param(
  [string]$Version = "2.0.0"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSCommandPath
$BackendDir = Join-Path $RepoRoot "backend"
$DistDir = Join-Path $RepoRoot "dist"
$ReleaseDir = Join-Path $DistDir "kepler-backend-v$Version"

Write-Host "Building Kepler Backend v$Version" -ForegroundColor Cyan

if (Test-Path $DistDir) { Remove-Item -Recurse -Force $DistDir }
New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null

Copy-Item -Path "$BackendDir\server.js" -Destination $ReleaseDir
Copy-Item -Path "$BackendDir\package.json" -Destination $ReleaseDir
Copy-Item -Path "$BackendDir\users.json" -Destination $ReleaseDir -ErrorAction SilentlyContinue
Copy-Item -Recurse -Path "$BackendDir\core" -Destination $ReleaseDir
Copy-Item -Recurse -Path "$BackendDir\services" -Destination $ReleaseDir
Copy-Item -Recurse -Path "$BackendDir\setup" -Destination $ReleaseDir
Copy-Item -Recurse -Path "$BackendDir\autostart" -Destination $ReleaseDir
Copy-Item -Path "$RepoRoot\emtypyie.json" -Destination $ReleaseDir
New-Item -ItemType Directory -Path "$ReleaseDir\notes" -Force | Out-Null
New-Item -ItemType File -Path "$ReleaseDir\notes\.gitkeep" -Force | Out-Null

# README
@"
Kepler Backend v$Version

Local service hub — ediary, pyieOS, and more.

Quick Start
-----------
1. Install Node.js v18+
2. Run:

   cd kepler-backend
   npm install
   node server.js

3. Open https://kepler.emtypyie.in in your browser
4. Create an account and start using services

Auto-Start
----------
See setup/ directory for platform-specific scripts.

API Health Check: GET http://localhost:41783/api/health
"@ | Out-File -FilePath "$ReleaseDir\README.txt" -Encoding UTF8

@"
@echo off
cd /d "%~dp0"
echo Installing dependencies...
call npm install
echo Starting Kepler Backend...
node server.js
"@ | Out-File -FilePath "$ReleaseDir\start.bat" -Encoding ASCII

$shScript = @"
#!/usr/bin/env bash
cd "`$(dirname "`$0")"
echo "Installing dependencies..."
npm install
echo "Starting Kepler Backend..."
node server.js
"@
$shScript | Out-File -FilePath "$ReleaseDir\start.sh" -Encoding ASCII

$zipFile = Join-Path $DistDir "kepler-backend-v$Version.zip"
Compress-Archive -Path "$ReleaseDir\*" -DestinationPath $zipFile -Force

Write-Host "Release created: $zipFile" -ForegroundColor Green
Write-Host "Size: $([math]::Round((Get-Item $zipFile).Length / 1KB)) KB" -ForegroundColor Gray
