# Build and install TraeGuardian into Trae IDE via terminal
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "==> TraeGuardian: building extension..." -ForegroundColor Cyan
Set-Location $Root

npm run compile --prefix extension
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run build:webview --prefix frontend
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Set-Location "$Root\extension"
npx @vscode/vsce package --no-dependencies
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$Vsix = Get-ChildItem -Path . -Filter "traeguardian-*.vsix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $Vsix) {
    Write-Error "No .vsix file produced. Check extension/package.json publisher and name."
    exit 1
}

Write-Host "==> Installing $($Vsix.Name) into Trae IDE..." -ForegroundColor Cyan

$traeCmd = Get-Command trae -ErrorAction SilentlyContinue
if (-not $traeCmd) {
    Write-Host ""
    Write-Host "The 'trae' CLI was not found in PATH." -ForegroundColor Yellow
    Write-Host "In Trae IDE: Command Palette -> 'Shell Command: Install trae command in PATH'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Then run:" -ForegroundColor Green
    Write-Host "  trae --install-extension $($Vsix.FullName)" -ForegroundColor White
    Write-Host ""
    Write-Host "Or drag the .vsix into Trae's Extension view." -ForegroundColor Yellow
    Write-Host "VSIX path: $($Vsix.FullName)" -ForegroundColor Gray
    exit 0
}

& trae --install-extension $Vsix.FullName
if ($LASTEXITCODE -eq 0) {
    Write-Host "==> TraeGuardian installed. Reload Trae IDE (Developer: Reload Window)." -ForegroundColor Green
} else {
    Write-Error "trae --install-extension failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}
