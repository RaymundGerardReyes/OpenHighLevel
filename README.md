# OpenFlow: Requirements-Driven GHL Workflow Simulator `v0.1.0`

> **Current Version:** `v0.1.0` (Modular Monolith Core, Trace-First Engine & Simulation Laboratory)

OpenFlow is an independently built, behavior-compatible workflow simulator and testing laboratory inspired by CRM automation systems.

## Engineering Highlights
- **Modular Monolith**: ASP.NET Core 10 backend + Next.js App Router frontend in a single repository.
- **Trace-First Execution Engine**: Every node transition, decision, state mutation, and scheduled wait leaves an immutable execution step trace.
- **Virtual Simulation Clock**: Run 30-day workflow timelines in milliseconds without waiting on real time.
- **PostgreSQL 18 Leases**: Durable scheduled task queue with transactional claiming via row-level locks and `SKIP LOCKED`.
- **Decoupled React Flow**: Canvas layout state is strictly separated from the semantic workflow graph domain model.

## Repository Layout
- `apps/web`: Next.js 15+ App Router workflow builder UI and execution visualizer.
- `apps/api`: ASP.NET Core REST API host.
- `apps/worker`: ASP.NET Core background worker host for scheduling & leases.
- `src/OpenFlow.Domain`: Core domain models, aggregates, invariants, and events.
- `src/OpenFlow.Contracts`: Shared request/response DTOs and contracts.
- `src/OpenFlow.Application`: Use cases, commands, queries, validators, and execution engine.
- `src/OpenFlow.Infrastructure`: EF Core, PostgreSQL persistence, and mock effect adapters.
- `tests/`: Domain unit tests, engine application tests, and golden compatibility fixtures.
- `scripts/`: Automation commands and codebase scaffolding scripts.

## Quick Start
1. Scaffold or refresh codebase:
   ```bash
   bash scripts/scaffold-openflow.sh
   # Or on Windows PowerShell:
   ./scripts/scaffold-openflow.ps1
   ```
2. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```
3. Run backend tests:
   ```bash
   dotnet test OpenFlow.sln
   ```
4. Run API:
   ```bash
   dotnet run --project apps/api
   ```
5. Run Worker:
   ```bash
   dotnet run --project apps/worker
   ```
6. Run Web:
   ```bash
   pnpm install
   pnpm dev
   ```
