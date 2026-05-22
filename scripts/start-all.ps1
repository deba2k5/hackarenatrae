# Start TraeGuardian backend + frontend (run from repo root)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "=== TraeGuardian start ===" -ForegroundColor Cyan

$venvPy = Join-Path $Root "backend\venv\Scripts\python.exe"
if (-not (Test-Path $venvPy)) {
    Write-Host "Creating venv..." -ForegroundColor Yellow
    Set-Location (Join-Path $Root "backend")
    py -3 -m venv venv
}

$pip = Join-Path $Root "backend\venv\Scripts\pip.exe"
if (-not (& $venvPy -c "import fastapi" 2>$null)) {
    Write-Host "Installing backend (prebuilt wheels for Python 3.13)..." -ForegroundColor Yellow
    & $pip install --upgrade pip wheel
    & $pip install --only-binary=:all: "pydantic>=2.10" 2>$null
    & $pip install fastapi uvicorn pymongo python-dotenv langgraph huggingface_hub numpy scikit-learn
    & $pip install sentence-transformers transformers accelerate datasets
    & $pip install chromadb FlagEmbedding
}

$deberta = Join-Path $Root "backend\models\deberta-terminal\config.json"
if (-not (Test-Path $deberta)) {
    Write-Host "Training DeBERTa (first run)..." -ForegroundColor Yellow
    Set-Location (Join-Path $Root "backend")
    & $venvPy -m training.train_deberta
}

Write-Host "Starting backend on :8000 ..." -ForegroundColor Green
Start-Process -FilePath $venvPy -ArgumentList "-m","uvicorn","main:app","--host","127.0.0.1","--port","8000" -WorkingDirectory (Join-Path $Root "backend") -WindowStyle Minimized

Start-Sleep -Seconds 2
Write-Host "Starting frontend on :5173 ..." -ForegroundColor Green
Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev" -WorkingDirectory (Join-Path $Root "frontend") -WindowStyle Minimized

Write-Host ""
Write-Host "  API:  http://127.0.0.1:8000/health" -ForegroundColor White
Write-Host "  UI:   http://127.0.0.1:5173" -ForegroundColor White
Write-Host "  Extension: open extension folder in Trae and press F5, or npm run install:trae" -ForegroundColor White
