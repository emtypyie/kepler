param(
  [string]$Version = "2.0.0"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSCommandPath
$BackendDir = Join-Path $RepoRoot "backend"
$DistDir = Join-Path $RepoRoot "dist"

if (Test-Path $DistDir) { Remove-Item -Recurse -Force $DistDir }
New-Item -ItemType Directory -Path $DistDir -Force | Out-Null

Push-Location $BackendDir

Write-Host "==> Installing build dependencies..." -ForegroundColor Cyan
npm install --silent
npm install -g pkg 2>$null

Write-Host "==> Building executables..." -ForegroundColor Cyan
pkg . --targets node18-win-x64,node18-linux-x64,node18-macos-x64 --out-path $DistDir

Pop-Location

# Rename for clarity
Rename-Item -Path "$DistDir\kepler-backend-win-x64.exe" -NewName "kepler-backend-v$Version-x64.exe" -ErrorAction SilentlyContinue
Rename-Item -Path "$DistDir\kepler-backend-linux-x64" -NewName "kepler-backend-v$Version-x64.AppImage" -ErrorAction SilentlyContinue
Rename-Item -Path "$DistDir\kepler-backend-macos-x64" -NewName "kepler-backend-v$Version-macos-x64" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================"
Write-Host "  Kepler v$Version built!" -ForegroundColor Green
Write-Host "============================================"
Write-Host ""
Get-ChildItem $DistDir | ForEach-Object {
  $size = [math]::Round($_.Length / 1MB, 2)
  Write-Host "  $($_.Name)  ($size MB)" -ForegroundColor Gray
}
Write-Host ""
