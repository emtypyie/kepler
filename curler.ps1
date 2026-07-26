$ErrorActionPreference = "Stop"
$Repo = "emtypyie/kepler"
$InstallDir = "$env:USERPROFILE\.kepler\backend"

Write-Host "==> Kepler Installer" -ForegroundColor Cyan
Write-Host ""

# Check for Docker
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
  Write-Host "==> Docker detected — deploying via Docker" -ForegroundColor Green
  $repoDir = "$env:USERPROFILE\.kepler\repo"
  if (-not (Test-Path $repoDir)) {
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.kepler" -Force | Out-Null
    git clone --depth 1 "https://github.com/$Repo.git" $repoDir
  } else {
    Set-Location $repoDir; git pull
  }
  Set-Location $repoDir
  docker compose up -d
  Write-Host ""
  Write-Host "  Kepler running at http://localhost:41783" -ForegroundColor Green
  Write-Host "  Open https://kepler.emtypyie.in in your browser"
  Write-Host ""
  exit 0
}

Write-Host "==> Docker not found — installing standalone exe" -ForegroundColor Yellow

# Download latest release exe
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
Write-Host "==> Downloading Kepler Backend..."
try {
  $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest"
  $asset = $release.assets | Where-Object { $_.name -like "*.exe" } | Select-Object -First 1
  if ($asset) {
    Write-Host "  Found: $($asset.name)"
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile "$InstallDir\kepler-backend.exe"
  } else {
    throw "No exe asset found"
  }
} catch {
  Write-Host "  Download failed: $_" -ForegroundColor Red
  exit 1
}

Write-Host "==> Installing as background service..."
# Run the setup script to register auto-start
$setupScript = "$InstallDir\setup\windows.ps1"
if (-not (Test-Path $setupScript)) {
  # Extract setup from exe? For now just create it
  Write-Host "  Setup script not found, creating scheduled task directly..."
  
  $taskName = "KeplerBackend"
  $batPath = "$InstallDir\autostart\kepler.bat"
  New-Item -ItemType Directory -Path (Split-Path $batPath -Parent) -Force | Out-Null
  @"
@echo off
cd /d "$InstallDir"
"$InstallDir\kepler-backend.exe"
"@ | Out-File -FilePath $batPath -Encoding ASCII
  
  # Create scheduled task for current user on logon
  schtasks /Create /SC ONLOGON /TN $taskName /TR "`"$batPath`"" /F 2>$null
  Write-Host "  Scheduled task created: $taskName"
} else {
  & $setupScript
}

# Start the service now
Write-Host "==> Starting Kepler..."
Start-Process -FilePath "$InstallDir\kepler-backend.exe" -WindowStyle Hidden -WorkingDirectory $InstallDir

Write-Host ""
Write-Host "============================================"
Write-Host "  Kepler installed and running!" -ForegroundColor Green
Write-Host "============================================"
Write-Host ""
Write-Host "  Runs in background on startup"
Write-Host "  Open https://kepler.emtypyie.in in your browser"
Write-Host "  API: http://localhost:41783/api/health"
Write-Host ""