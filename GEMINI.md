# OpenFlow Workspace Rules

## .NET Project References
- Always use **forward slashes** (`/`) in `.csproj` `<ProjectReference>` paths, never backslashes.
- Example: `<ProjectReference Include="../../src/OpenFlow.Domain/OpenFlow.Domain.csproj" />`
- Reason: Backslashes cause `dotnet restore` to silently skip projects with garbled paths on cross-platform builds.

## EF Core DbContext Registration
- Always register `DbContext` and `IApplicationDbContext` as **Scoped**, never Singleton.
- `services.AddScoped<IApplicationDbContext, OpenFlowDbContext>();`
- Reason: EF Core DbContext is not thread-safe. Singleton registration causes data corruption under concurrent API requests.

## PostgreSQL Task Queue — SKIP LOCKED
- When implementing scheduled task claiming for the worker, always use `FOR UPDATE SKIP LOCKED` row-level locking.
- Never use plain LINQ `.Where().Take().ToList()` for task claiming — it causes race conditions where multiple workers claim the same task.
- Reason: Without SKIP LOCKED, scaling to multiple worker instances causes duplicate workflow executions.

## Trace-First Execution
- Always persist an ExecutionStep record **before** dispatching side effects (webhooks, SMS, emails).
- The step should be saved as `Running` before the effect, then updated to `Completed` after.
- Never dispatch an effect and then create the step — if the process crashes between dispatch and persistence, the trace is lost but the effect already fired.
- Reason: This is the #1 architecture principle — every step must leave a visible record before any irreversible action.

## Virtual Time — Use ISimulationClock
- Never use `DateTime.UtcNow` directly in Application or Domain layer handlers.
- Always inject and use `ISimulationClock.UtcNow` for all timestamps.
- Reason: The simulation engine manipulates time for deterministic replay. Hardcoded `DateTime.UtcNow` breaks simulation mode.

## Frontend API Contracts
- The frontend (`apps/web`) must consume a **generated TypeScript client** from the backend OpenAPI spec.
- Never use raw `fetch()` with manually constructed URLs in API wrapper files.
- Reason: Manual fetch calls have no compile-time type safety and silently break when backend contracts change.

## Dependency Rules (Hard Enforcement)
- `OpenFlow.Domain` must reference **nothing** — no EF Core, no HTTP, no logging frameworks.
- `OpenFlow.Application` must reference only `Domain` and `Contracts` — never Infrastructure.
- `OpenFlow.Infrastructure` implements interfaces defined in Application.
- `apps/api` and `apps/worker` are composition roots only — no business logic.

## Execution Engine & Wait Invariants
- When persisting intermediate context state on an execution that is transitioning to `Waiting`, never call `execution.MoveToNode(...)` as it resets the status to `Running`. Always use `execution.UpdateContext(...)`.
- For trace-first side effects, persist `ExecutionStep.Start(...)` (Status: `Running`) to the database *before* calling `IEffectDispatcher.DispatchAsync(...)`, then call `step.Complete(...)` or `step.Fail(...)` upon return.

## Controller & Handler Clock Propagation
- API controllers and background worker services must inject `ISimulationClock` and pass it to use-case handlers. Never allow command handlers to fall back to `DateTime.UtcNow`.

