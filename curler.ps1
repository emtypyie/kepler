$ErrorActionPreference = "Stop"
$Repo = "emtypyie/kepler"
$InstallDir = "$env:USERPROFILE\.kepler"

Write-Host "==> Kepler Backend Installer" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$nodeVer = node -v 2>$null
if (-not $nodeVer) {
  Write-Host "==> Node.js not found. Downloading..."
  $nodeUrl = "https://nodejs.org/dist/v22.0.0/node-v22.0.0-x64.msi"
  $installer = "$env:TEMP\node-installer.msi"
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $nodeUrl -OutFile $installer
  Write-Host "    Installing Node.js..."
  Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /quiet /norestart" -Wait
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
  $nodeVer = node -v
}
Write-Host "   Node $nodeVer"

# Download latest release
Write-Host "==> Downloading Kepler Backend..."
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
$zipFile = "$InstallDir\kepler-backend.zip"
try {
  $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest"
  $asset = $release.assets | Where-Object { $_.name -like "*kepler-backend*" } | Select-Object -First 1
  if ($asset) {
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipFile
  }
} catch {
  Write-Host "    Download failed, trying direct URL..."
  Invoke-WebRequest -Uri "https://github.com/$Repo/releases/latest/download/kepler-backend-v2.0.0.zip" -OutFile $zipFile
}

Write-Host "==> Extracting..."
Remove-Item -Recurse -Force "$InstallDir\backend" -ErrorAction SilentlyContinue
Expand-Archive -Path $zipFile -DestinationPath "$InstallDir\backend" -Force
Remove-Item $zipFile -Force

Set-Location "$InstallDir\backend"

Write-Host "==> Installing dependencies..."
npm install --silent

Write-Host ""
Write-Host "============================================"
Write-Host "  Kepler Backend installed!" -ForegroundColor Green
Write-Host "============================================"
Write-Host ""
Write-Host "  Start the server:"
Write-Host "    cd $InstallDir\backend && node server.js"
Write-Host ""
Write-Host "  Or set up auto-start (PowerShell as Admin):"
Write-Host "    powershell -ExecutionPolicy Bypass -File `"$InstallDir\backend\setup\windows.ps1`""
Write-Host ""
Write-Host "  Or set up auto-start (Linux/bash):"
Write-Host "    sudo $InstallDir\backend\setup\linux.sh"
Write-Host ""
Write-Host "  Or set up auto-start (macOS/bash):"
Write-Host "    $InstallDir\backend\setup\macos.sh"
Write-Host ""
Write-Host "  Open https://kepler.emtypyie.in in your browser"
Write-Host "  to create an account and start using services."
Write-Host ""

$choice = Read-Host "Start Kepler Backend now? [Y/n]"
if ($choice -ne "n" -and $choice -ne "N") {
  node server.js
}
