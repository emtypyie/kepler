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
# Create VBScript wrapper that runs exe completely hidden
$vbsPath = "$InstallDir\run-hidden.vbs"
@"
CreateObject("Wscript.Shell").Run """" & WScript.Arguments(0) & """", 0, False
"@ | Out-File -FilePath $vbsPath -Encoding ASCII

$taskName = "KeplerBackend"
$batPath = "$InstallDir\autostart\kepler.bat"
New-Item -ItemType Directory -Path (Split-Path $batPath -Parent) -Force | Out-Null
@"
@echo off
cd /d "$InstallDir"
cscript //nologo "$vbsPath" "$InstallDir\kepler-backend.exe"
"@ | Out-File -FilePath $batPath -Encoding ASCII

# Create scheduled task - runs hidden, at logon, with highest privileges
schtasks /Create /SC ONLOGON /TN $taskName /TR "`"$batPath`"" /RL HIGHEST /F 2>$null
# Set task to run hidden
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($task) {
  $task.Settings.Hidden = $true
  Set-ScheduledTask -TaskName $taskName -Settings $task.Settings -ErrorAction SilentlyContinue
}
Write-Host "  Scheduled task created (hidden): $taskName"

# Start the service now (hidden)
Write-Host "==> Starting Kepler..."
$vbsPath = "$InstallDir\run-hidden.vbs"
Start-Process -FilePath "cscript" -ArgumentList "//nologo", "`"$vbsPath`"", "`"$InstallDir\kepler-backend.exe`"" -WindowStyle Hidden -WorkingDirectory $InstallDir

Write-Host ""
Write-Host "============================================"
Write-Host "  Kepler installed and running!" -ForegroundColor Green
Write-Host "============================================"
Write-Host ""
Write-Host "  Runs in background on startup"
Write-Host "  Open https://kepler.emtypyie.in in your browser"
Write-Host "  API: http://localhost:41783/api/health"
Write-Host ""