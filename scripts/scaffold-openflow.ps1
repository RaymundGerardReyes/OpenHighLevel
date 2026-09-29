# ==============================================================================
# OpenFlow Automated Codebase Infrastructure Scaffolding Script (PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "🚀 [OpenFlow] Initializing Codebase Infrastructure & Reference Scaffold" -ForegroundColor Cyan
Write-Host "Target Directory: $RootDir" -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Cyan

Set-Location $RootDir

Write-Host "==> 1. Generating monorepo folders, projects, contracts, and code..." -ForegroundColor Yellow
node "$ScriptDir\scaffold.js"

Write-Host "==> 2. Restoring .NET 10 solution packages..." -ForegroundColor Yellow
dotnet restore OpenFlow.sln

Write-Host "==> 3. Compiling full modular monolith backend solution..." -ForegroundColor Yellow
dotnet build OpenFlow.sln --no-restore

Write-Host "==> 4. Executing domain and application execution engine test suites..." -ForegroundColor Yellow
dotnet test OpenFlow.sln --no-build

Write-Host "======================================================================" -ForegroundColor Green
Write-Host "✅ [OpenFlow] Architecture Infrastructure Scaffolding Complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Gray
Write-Host "  - Start DB: docker compose up -d" -ForegroundColor Gray
Write-Host "  - Run API:  dotnet run --project apps/api" -ForegroundColor Gray
Write-Host "  - Run Worker: dotnet run --project apps/worker" -ForegroundColor Gray
Write-Host "  - Run Web:  pnpm install; pnpm dev" -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Green
