# Local Developer Setup Guide

## Prerequisites
- .NET 10 SDK (`10.0.301`+)
- Node.js (`v22`+)
- pnpm (`10`+)
- Docker & Docker Compose (for PostgreSQL 18)

## Quick Start
1. Run scaffolding:
   ```bash
   bash scripts/scaffold-openflow.sh
   # On Windows:
   ./scripts/scaffold-openflow.ps1
   ```
2. Spin up database:
   ```bash
   docker compose up -d
   ```
3. Run test suite:
   ```bash
   dotnet test OpenFlow.sln
   ```
4. Launch backend API:
   ```bash
   dotnet run --project apps/api
   ```
5. Launch background worker:
   ```bash
   dotnet run --project apps/worker
   ```
6. Launch web UI:
   ```bash
   pnpm install
   pnpm dev
   ```
