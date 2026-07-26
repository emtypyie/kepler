$ErrorActionPreference = "Stop"
$Repo = "emtypyie/kepler"
$InstallDir = "$env:USERPROFILE\.kepler"

Write-Host "==> Kepler Installer" -ForegroundColor Cyan
Write-Host ""

# Check for Docker
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
  Write-Host "==> Docker detected — deploying via Docker" -ForegroundColor Green
  if (-not (Test-Path "$InstallDir\repo")) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    git clone --depth 1 "https://github.com/$Repo.git" "$InstallDir\repo"
  } else {
    Set-Location "$InstallDir\repo"; git pull
  }
  Set-Location "$InstallDir\repo"
  docker compose up -d
  Write-Host ""
  Write-Host "  Kepler running at http://localhost:41783" -ForegroundColor Green
  Write-Host "  Open https://kepler.emtypyie.in in your browser"
  Write-Host ""
  exit 0
}

Write-Host "==> Docker not found — installing directly" -ForegroundColor Yellow

# Check Node.js
$nodeVer = node -v 2>$null
if (-not $nodeVer) {
  Write-Host "==> Node.js not found. Downloading..."
  $nodeUrl = "https://nodejs.org/dist/v22.0.0/node-v22.0.0-x64.msi"
  $installer = "$env:TEMP\node-installer.msi"
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $nodeUrl -OutFile $installer
  Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /quiet /norestart" -Wait
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
  $nodeVer = node -v
}
Write-Host "   Node $nodeVer"

Write-Host "==> Downloading Kepler Backend..."
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
$zipFile = "$InstallDir\kepler-backend.zip"
try {
  $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest"
  $asset = $release.assets | Where-Object { $_.name -like "*kepler-backend*" } | Select-Object -First 1
  if ($asset) { Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipFile }
} catch {
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
Write-Host "  Start: cd $InstallDir\backend && node server.js"
Write-Host "  Open  https://kepler.emtypyie.in"
Write-Host ""

$choice = Read-Host "Start Kepler Backend now? [Y/n]"
if ($choice -ne "n" -and $choice -ne "N") {
  node server.js
}
