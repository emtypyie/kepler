param(
  [switch]$Remove
)

$scriptPath = Split-Path -Parent $PSCommandPath
$backendDir = Join-Path $scriptPath ".." | Resolve-Path
$nodePath = (Get-Command node).Source
$taskName = "KeplerBackend"

if ($Remove) {
  schtasks /Delete /TN $taskName /F 2>$null
  Write-Host "Auto-start removed." -ForegroundColor Green
  return
}

$batPath = Join-Path $backendDir "autostart\kepler.bat"
@"
@echo off
cd /d "$backendDir"
"$nodePath" server.js
"@ | Out-File -FilePath $batPath -Encoding ASCII

schtasks /Create /SC ONSTART /TN $taskName /TR "`"$batPath`"" /RU %USERNAME% /F 2>$null
Write-Host "Auto-start configured. Kepler backend will launch on boot." -ForegroundColor Green
Write-Host "To remove: .\windows.ps1 -Remove" -ForegroundColor Gray
