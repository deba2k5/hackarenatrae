# Create venv and install TraeGuardian backend (local ML stack, no API keys)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"

Set-Location $Backend

if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "Creating Python venv..." -ForegroundColor Cyan
    py -3 -m venv venv
}

Write-Host "Installing dependencies (may take several minutes)..." -ForegroundColor Cyan
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\pip.exe install -r requirements.txt

Write-Host "Training DeBERTa-v3 on seed data..." -ForegroundColor Cyan
.\venv\Scripts\python.exe -m training.train_deberta

Write-Host "Done. Start backend with:" -ForegroundColor Green
Write-Host "  cd backend; .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000" -ForegroundColor White
