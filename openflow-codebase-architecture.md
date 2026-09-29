# OpenFlow Codebase Architecture

## Objective

This architecture is designed for **OpenFlow**, an independently built workflow simulator inspired by HighLevel-style workflow behavior.

Primary engineering goals:
- Maintainable for long-term iteration.
- Scalable without premature microservices.
- Debuggable through explicit execution traces.
- Trackable through structured logs, audit records, and versioned workflow definitions.
- Understandable for new developers through strict boundaries and predictable folder conventions.
- Strongly connected frontend and backend with shared API contracts.

---

## Engineering principles

1. **Modular monolith first**
   - One repository.
   - One primary PostgreSQL database.
   - Separate executable apps where needed (`web`, `api`, `worker`).
   - Strong internal boundaries, but no microservice overhead.

2. **Dependencies point inward**
   - Domain depends on nothing.
   - Application depends only on Domain.
   - Infrastructure depends on Application and Domain.
   - API and Worker are composition roots only.

3. **Feature-first inside layers**
   - Organize by business capability, not by technical artifact alone.
   - Example: `Workflows`, `Executions`, `Contacts`, `SimulationRuns`.

4. **Immutable published workflow versions**
   - Drafts can change.
   - Published versions never change.
   - Executions always reference the version they started from.

5. **Trace-first execution model**
   - Every step must leave a visible record.
   - All node decisions, inputs, outputs, waits, failures, and effects are inspectable.

6. **Small focused files**
   - Prefer files around 40 to 100 lines where practical.
   - Split orchestration, validation, mapping, persistence, and transport concerns.

7. **Contracts over assumptions**
   - Frontend should consume generated typed clients from backend OpenAPI.
   - Avoid handwritten duplicated request/response models across web and API.

---

## Recommended repository layout

```text
OpenFlow/
├── apps/
│   ├── web/                         # Next.js frontend
│   ├── api/                         # ASP.NET Core host for REST APIs
│   └── worker/                      # ASP.NET Core background worker host
│
├── src/
│   ├── OpenFlow.Domain/
│   │   ├── Common/
│   │   ├── Workflows/
│   │   ├── Executions/
│   │   ├── Contacts/
│   │   ├── Simulation/
│   │   ├── Scheduling/
│   │   └── Audit/
│   │
│   ├── OpenFlow.Application/
│   │   ├── Abstractions/
│   │   ├── Common/
│   │   ├── Workflows/
│   │   ├── Executions/
│   │   ├── Contacts/
│   │   ├── SimulationRuns/
│   │   ├── Scheduling/
│   │   └── Audit/
│   │
│   ├── OpenFlow.Infrastructure/
│   │   ├── Persistence/
│   │   ├── Workflows/
│   │   ├── Scheduling/
│   │   ├── Effects/
│   │   ├── Observability/
│   │   ├── Identity/
│   │   └── Integrations/
│   │
│   └── OpenFlow.Contracts/
│       ├── Workflows/
│       ├── Executions/
│       ├── Contacts/
│       ├── SimulationRuns/
│       └── Common/
│
├── tests/
│   ├── OpenFlow.Domain.Tests/
│   ├── OpenFlow.Application.Tests/
│   ├── OpenFlow.Infrastructure.Tests/
│   ├── OpenFlow.Api.IntegrationTests/
│   ├── OpenFlow.Worker.IntegrationTests/
│   ├── OpenFlow.CompatibilityTests/
│   └── OpenFlow.E2E/
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── api/
│   ├── compatibility/
│   ├── runbooks/
│   └── onboarding/
│
├── scripts/
├── .github/
├── compose.yaml
├── package.json
├── pnpm-workspace.yaml
├── Directory.Build.props
├── Directory.Packages.props
├── global.json
└── README.md
```

---

## Layer responsibilities

### 1. `apps/web`

Purpose:
- Workflow builder UI.
- Execution trace viewer.
- Test/simulation runner.
- Admin settings.
- Authentication entry UI.

Rules:
- No direct database access.
- No workflow business rules in React components.
- All server communication goes through typed API clients.
- Route composition lives in Next.js `app/`.
- Feature logic lives in feature folders, not inside route files.

### 2. `apps/api`

Purpose:
- Expose REST endpoints.
- Validate auth context.
- Map HTTP requests to application use cases.
- Return typed DTOs.
- Publish OpenAPI definition.

Rules:
- Keep controllers/endpoints thin.
- No EF queries directly in endpoints.
- No business decisions in request handlers beyond transport concerns.

### 3. `apps/worker`

Purpose:
- Poll due scheduled tasks.
- Resume waiting workflow executions.
- Execute async effects and retries.
- Maintain leases for distributed-safe job claiming.

Rules:
- No duplicated business logic.
- Must call Application services/commands exactly like API-triggered execution.
- Worker-specific code should only handle scheduling, concurrency, retry loops, and host lifecycle.

### 4. `OpenFlow.Domain`

Purpose:
- Business rules.
- Aggregate invariants.
- Value objects.
- Domain events.
- Execution-state semantics.

Rules:
- No EF Core attributes if avoidable.
- No HTTP types.
- No logging framework types.
- No infrastructure concerns.

### 5. `OpenFlow.Application`

Purpose:
- Use cases.
- Commands and queries.
- Validation.
- Authorization rules at use-case boundary.
- Transaction orchestration.
- Interfaces for persistence, clock, identity, messaging, and effect dispatch.

Rules:
- No framework-heavy code.
- No SQL or EF queries directly.
- Business workflows are coordinated here.

### 6. `OpenFlow.Infrastructure`

Purpose:
- EF Core persistence.
- PostgreSQL queue implementation.
- Auth providers.
- Effect transports.
- OpenTelemetry/logging adapters.
- Filesystem and external services.

Rules:
- Implements interfaces from Application.
- Can reference libraries and frameworks freely.
- Must not push infrastructure concerns back upward.

### 7. `OpenFlow.Contracts`

Purpose:
- Shared transport contracts.
- Request/response DTOs.
- Pagination models.
- Error envelopes.
- Event schemas if needed.

Rules:
- No domain logic.
- No persistence logic.
- Keep highly stable.

---

## Dependency rules

```text
apps/web  -> generated API client only
apps/api  -> Application, Infrastructure, Contracts
apps/worker -> Application, Infrastructure
Infrastructure -> Application, Domain
Application -> Domain
Contracts -> none or very minimal shared primitives
Domain -> none
```

Hard rule:
- `Domain` must never reference `Application`, `Infrastructure`, `API`, `Worker`, or `Web`.
- `Application` must never reference `Infrastructure` concrete implementations.
- `Web` must never import backend source files directly.

---

## Backend feature layout

Inside `OpenFlow.Application`, prefer **feature slices**:

```text
OpenFlow.Application/
├── Workflows/
│   ├── Commands/
│   │   ├── CreateWorkflow/
│   │   ├── UpdateWorkflowDraft/
│   │   ├── PublishWorkflowVersion/
│   │   └── ArchiveWorkflow/
│   ├── Queries/
│   │   ├── GetWorkflow/
│   │   ├── ListWorkflows/
│   │   └── GetWorkflowBuilderState/
│   ├── Validators/
│   ├── Mappers/
│   └── Services/
├── Executions/
│   ├── Commands/
│   │   ├── StartExecution/
│   │   ├── ResumeExecution/
│   │   ├── CancelExecution/
│   │   └── RetryExecutionStep/
│   ├── Queries/
│   │   ├── GetExecutionTrace/
│   │   ├── ListExecutions/
│   │   └── GetExecutionStep/
│   ├── Policies/
│   └── Services/
```

Each use-case folder should ideally contain:
- Request model.
- Response model.
- Validator.
- Handler/service.
- Mapping logic if needed.
- Unit tests nearby in mirrored test structure.

This makes code discoverable for new developers: “find feature, then command or query, then handler.”

---

## Domain design

### Core aggregates

Recommended first-class aggregates:
- `Workflow`
- `WorkflowVersion`
- `Execution`
- `ScheduledTask`
- `SimulationRun`
- `Contact`

### Value objects

Use value objects for:
- `WorkflowId`
- `ExecutionId`
- `NodeId`
- `EdgeId`
- `TenantId`
- `TraceId`
- `UtcInstant`
- `TimeZoneId`
- `NodePort`
- `RetryPolicy`

### Domain folders

```text
OpenFlow.Domain/
├── Workflows/
│   ├── Workflow.cs
│   ├── WorkflowVersion.cs
│   ├── WorkflowNode.cs
│   ├── WorkflowEdge.cs
│   ├── WorkflowStatus.cs
│   ├── NodeType.cs
│   ├── Ports/
│   ├── Rules/
│   └── Events/
├── Executions/
│   ├── Execution.cs
│   ├── ExecutionStep.cs
│   ├── ExecutionStatus.cs
│   ├── ExecutionCursor.cs
│   ├── ExecutionContext.cs
│   ├── EffectIntent.cs
│   ├── WaitState.cs
│   ├── Policies/
│   └── Events/
```

### Domain invariants

Examples of rules that belong in Domain:
- A published workflow version cannot be mutated.
- An execution cannot move if already completed or cancelled.
- A node transition must target a valid port.
- Wait nodes must produce a resumable checkpoint.
- Effect intents must have deterministic identifiers.
- Goal completion behavior must follow explicit policy.

---

## API architecture

Use REST with explicit versioning from the start.

### Route shape

```text
/api/v1/workflows
/api/v1/workflows/{workflowId}
/api/v1/workflows/{workflowId}/draft
/api/v1/workflows/{workflowId}/publish
/api/v1/workflow-versions/{versionId}
/api/v1/executions
/api/v1/executions/{executionId}
/api/v1/executions/{executionId}/trace
/api/v1/simulations
/api/v1/contacts
```

### API design rules

- One endpoint should map to one use case as much as practical.
- Avoid “god endpoints” returning unrelated data.
- Use problem-details style error responses.
- Emit correlation IDs in every response.
- Include pagination consistently.
- Keep DTOs stable even if domain internals evolve.

### OpenAPI-first connection

Backend should publish an OpenAPI spec.
Frontend should generate a typed TypeScript client from that spec.

That gives:
- Safer request and response types.
- Fewer contract mismatches.
- Easier refactors.
- Better onboarding for frontend contributors.

---

## Frontend architecture

Use Next.js App Router, but keep route files extremely thin.

### Recommended web structure

```text
apps/web/
├── app/
│   ├── (marketing)/
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── workflows/
│   │   │   ├── page.tsx
│   │   │   ├── [workflowId]/page.tsx
│   │   │   └── [workflowId]/builder/page.tsx
│   │   ├── executions/
│   │   ├── simulations/
│   │   └── settings/
│   ├── error.tsx
│   ├── loading.tsx
│   ├── layout.tsx
│   └── providers.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── features/
│   ├── workflows/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── schemas/
│   │   ├── mappers/
│   │   └── utils/
│   ├── executions/
│   ├── simulations/
│   ├── contacts/
│   └── auth/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── config/
│   ├── errors/
│   ├── telemetry/
│   └── utils/
│
├── generated/
│   └── api-client/
│
├── styles/
├── public/
├── tests/
└── e2e/
```

### Frontend state rules

Use **Zustand** only for client/editor state:
- selected node
- selected edge
- viewport
- temporary drag state
- unsaved draft changes
- panel visibility

Use **TanStack Query** for server state:
- workflows list
- workflow details
- published versions
- execution trace
- contacts
- simulations

Never mix them casually.
A common failure in dashboard codebases is putting server-fetched records into client stores and losing cache consistency.

### React Flow boundary

Do not let React Flow node objects become the source of truth.

Keep two representations:
- `builderGraph` for backend-compatible semantic draft data.
- `canvasState` for viewport, positions, selection, collapsed state, and UI-only metadata.

This prevents UI libraries from shaping your domain model.

---

## Frontend-backend connection model

The connection must be explicit and typed.

### Recommended flow

```text
ASP.NET Core API
   -> OpenAPI spec
   -> generated TypeScript client
   -> feature API wrapper
   -> TanStack Query hooks
   -> React feature components
```

### Practical layering inside web

```text
features/workflows/api/
  list-workflows.ts
  get-workflow.ts
  save-draft.ts
  publish-workflow.ts

features/workflows/hooks/
  use-workflows.ts
  use-workflow.ts
  use-save-workflow-draft.ts
  use-publish-workflow.ts
```

Rules:
- Components do not call raw fetch directly.
- Hooks do not manually construct URLs.
- API wrappers call only generated client methods.
- Mapping to UI view-models happens in `mappers/`.

This gives one clear place to debug contract issues.

---

## Workflow builder module design

The workflow builder should be split into focused modules.

```text
features/workflows/components/builder/
├── BuilderShell.tsx
├── WorkflowCanvas.tsx
├── NodePalette.tsx
├── InspectorPanel.tsx
├── ValidationPanel.tsx
├── ExecutionOverlay.tsx
├── controls/
├── nodes/
│   ├── TriggerNode.tsx
│   ├── ActionNode.tsx
│   ├── WaitNode.tsx
│   ├── ConditionNode.tsx
│   ├── GoalNode.tsx
│   └── EndNode.tsx
└── edges/
```

Recommended internal separation:
- `components/` for UI
- `schemas/` for Zod or validation schemas
- `mappers/` for DTO <-> builder state conversion
- `stores/` for Zustand editor state
- `utils/graph/` for pure graph logic
- `utils/layout/` for node placement helpers
- `utils/validation/` for client-side draft validation

Keep graph algorithms pure and framework-independent where possible.
That makes them testable without rendering React.

---

## Worker and scheduling architecture

### Execution pipeline

```text
Trigger/Event/API request
    -> Application command
    -> Create Execution
    -> Execute current node
    -> Persist step trace
    -> Schedule next task or complete
```

### Wait/resume pipeline

```text
Worker loop
    -> claim due ScheduledTask rows
    -> create scope
    -> call ResumeExecution use case
    -> persist result
    -> release/complete task
```

### Worker internals

Recommended modules in `apps/worker`:

```text
apps/worker/
├── Hosting/
├── Scheduling/
│   ├── TaskPollingService.cs
│   ├── LeaseRenewalService.cs
│   └── WorkerOptions.cs
├── Observability/
└── Program.cs
```

Keep actual workflow semantics outside the worker host.
The worker host should orchestrate infrastructure timing only.

---

## Persistence design

### Database principles

- One PostgreSQL database.
- Separate schemas if needed (`app`, `audit`, `ops`).
- Use migrations from a single controlled path.
- Prefer explicit relational columns for identity, status, timestamps, ownership, and concurrency.
- Use JSONB for versioned node configuration and trace payloads where schema flexibility matters.

### Suggested tables

```text
workflows
workflow_versions
workflow_nodes
workflow_edges
executions
execution_steps
scheduled_tasks
effect_intents
simulation_runs
contacts
contact_tags
audit_logs
outbox_messages
```

### Persistence boundaries

- Repositories are optional; do not force a repository abstraction over every EF query.
- Use query services/read models for complex reads.
- Use aggregate-focused write persistence.
- Separate operational queries from transactional write logic.

### Concurrency rules

- Use optimistic concurrency tokens for drafts.
- Use row-level claims and leases for scheduled tasks.
- Use unique idempotency keys for effect intents.
- Never rely on memory-only state for execution progress.

---

## Observability design

This project will fail to stay maintainable if observability is weak.

### Mandatory telemetry pillars

1. **Structured logs**
   - Every log line should include:
     - `traceId`
     - `executionId`
     - `workflowId`
     - `workflowVersionId`
     - `nodeId`
     - `tenantId` if multi-tenant
     - `correlationId`

2. **Audit logs**
   - Capture who changed workflow drafts, published versions, or cancelled executions.

3. **Execution traces**
   - Node input snapshot.
   - Decision output.
   - State diff.
   - Duration.
   - Error details.
   - Retry attempt.

4. **Metrics**
   - executions started/completed/failed
   - average node duration
   - scheduled task backlog
   - retry count by node type
   - webhook success/failure

5. **Health checks**
   - API readiness/liveness
   - database connectivity
   - worker queue lag status

### Debuggability requirement

Any production or local failure should be answerable by this path:

```text
User report
 -> correlation id
 -> execution id
 -> execution trace
 -> failed node step
 -> effect intent or validation result
 -> root cause
```

If that path does not exist, the architecture is incomplete.

---

## Security and access design

For the first serious version:
- ASP.NET Core Identity or equivalent auth provider.
- Policy-based authorization.
- Separate roles for admin, editor, viewer, tester.
- Route-level and use-case-level authorization.
- Never trust frontend role checks alone.

Keep auth modular:

```text
Infrastructure/Identity/
Application/Abstractions/IUserContext.cs
Application/Abstractions/IAuthorizationService.cs
```

This allows later replacement without rewriting domain logic.

---

## Testing architecture

### Test pyramid

1. **Domain tests**
   - Pure business rules.
   - Fastest tests.
   - Most numerous.

2. **Application tests**
   - Use-case behavior.
   - Mock interfaces when needed.
   - Verify orchestration and validation.

3. **Integration tests**
   - PostgreSQL + infrastructure wiring.
   - Real migrations.
   - Real serialization.
   - Real API surface.

4. **Compatibility tests**
   - Golden workflow cases.
   - Deterministic input/output expectations.
   - Workflow behavior regression protection.

5. **E2E tests**
   - Critical builder flows.
   - Login, create workflow, publish, run simulation, inspect trace.

### Compatibility case pattern

```text
tests/fixtures/
├── workflows/
│   ├── wait-duration/
│   ├── if-else/
│   ├── goal/
│   └── webhook/
└── simulations/
```

Every supported behavior should have a case file with:
- initial state
- workflow version
- input event
- simulation clock
- fixture responses
- expected path
- expected final state
- expected emitted effects

---

## Documentation architecture

Your docs must be treated as part of the codebase, not as optional notes.

### Required docs folders

```text
docs/
├── architecture/
│   ├── overview.md
│   ├── repository-structure.md
│   ├── dependency-rules.md
│   ├── frontend-architecture.md
│   ├── backend-architecture.md
│   ├── worker-architecture.md
│   ├── database-architecture.md
│   └── observability.md
├── adr/
├── compatibility/
├── onboarding/
└── runbooks/
```

### Must-have documents

- `README.md` — quick start and repository map.
- `architecture/overview.md` — system context and dependency rules.
- `onboarding/local-setup.md` — exact setup steps.
- `runbooks/debug-execution-failure.md` — how to investigate issues.
- `compatibility/*.md` — supported workflow semantics and gaps.
- `adr/*.md` — architecture decision records.

New developers should be able to answer these within 10 minutes:
- Where do I add a new workflow node?
- Where is execution logic?
- How is API generated for frontend?
- How do I run a simulation locally?
- How do I trace a failed execution?

---

## Naming conventions

### Backend

- Projects: `OpenFlow.Domain`, `OpenFlow.Application`, `OpenFlow.Infrastructure`
- Features: singular business names like `Workflow`, `Execution`, `Contact` or grouped feature folders such as `Workflows`, `Executions`
- Commands: `CreateWorkflowCommand`
- Queries: `GetExecutionTraceQuery`
- Handlers: `CreateWorkflowHandler`
- DTOs: suffix with `Request`, `Response`, `Dto`
- Interfaces: prefix with `I`

### Frontend

- Components: PascalCase, one component per file.
- Hooks: `useXxx.ts`
- Stores: `xxx.store.ts`
- Mappers: `xxx.mapper.ts`
- Schemas: `xxx.schema.ts`
- Query options: `xxx.query.ts`
- Route files stay thin and mostly compose feature modules.

---

## File-size discipline

To keep the codebase understandable:
- Prefer one responsibility per file.
- Split validators, mappers, handlers, and policies.
- Avoid 400-line React components.
- Avoid “Util.cs” or “helpers.ts” dumping grounds.
- If a file mixes orchestration, validation, mapping, I/O, and business rules, split it.

Practical heuristic:
- 40–100 lines ideal.
- 150 lines acceptable when cohesive.
- Beyond that, review for extraction.

---

## CI/CD and engineering governance

### Pull request gates

- format/lint passes
- typecheck passes
- unit tests pass
- integration tests pass
- OpenAPI generation up to date
- generated TypeScript client up to date
- migration validation passes
- architecture tests pass

### Architecture tests

Add automated checks for dependency rules.
Examples:
- Domain must not reference Infrastructure.
- Web must not import private backend code.
- Feature modules must not import from unrelated feature internals.

### Branch strategy

- `main` always releasable.
- Short-lived feature branches.
- Every structural change gets an ADR.

---

## Local development flow

Recommended developer workflow:

1. Start PostgreSQL with `compose.yaml`.
2. Run backend API locally.
3. Run worker locally.
4. Generate or refresh OpenAPI spec.
5. Regenerate TypeScript client.
6. Run web app.
7. Execute domain/application tests.
8. Execute a golden simulation case.
9. Open workflow builder and inspect trace UI.

This keeps frontend and backend contract validation part of the daily workflow rather than a late integration step.

---

## Example responsibility map

| Concern | Frontend | API | Application | Domain | Infrastructure | Worker |
|---|---|---|---|---|---|---|
| Canvas rendering | Yes | No | No | No | No | No |
| Workflow draft validation (UX-level) | Yes | No | No | No | No | No |
| Workflow publish validation (business-level) | No | Thin entry | Yes | Yes | No | No |
| Execution step rules | No | No | Yes | Yes | No | No |
| Schedule claiming | No | No | Via abstraction | No | Yes | Yes |
| OpenAPI generation | No | Yes | No | No | No | No |
| TypeScript API client generation | Yes | Source only | No | No | No | No |
| Structured logging sink | No | Host wiring | Partial | No | Yes | Yes |
| Trace visualization | Yes | Returns data | Yes | Produces semantics | Stores data | Produces events |

---

## Recommended non-functional standards

### Maintainability
- Enforce dependency boundaries.
- Prefer feature slices.
- Keep files small.
- Document major decisions.

### Scalability
- Modular monolith first.
- Separate worker host.
- Stateless API.
- Durable PostgreSQL scheduling.

### Debuggability
- Correlation IDs everywhere.
- Full execution trace records.
- Effect intent logs.
- Golden compatibility tests.

### Trackability
- Audit logs.
- Published version history.
- Execution status transitions.
- Operational metrics.

### Understandability
- One obvious place for each type of code.
- Thin routes/controllers.
- Naming consistency.
- Docs for onboarding and debugging.

---

## Final architectural decision

The best overall principal-engineering-level approach for OpenFlow is:

- **Monorepo** with `apps/` and `src/` separation.
- **Modular monolith** backend using Domain, Application, Infrastructure, Contracts.
- **Next.js App Router** frontend using route-thin, feature-first organization.
- **Typed frontend-backend contract** through OpenAPI-generated TypeScript client.
- **React Flow isolated from business model**.
- **ASP.NET Core API + Worker** sharing the same application core.
- **PostgreSQL** as the system of record and initial scheduling backbone.
- **Trace-first workflow engine** so every simulation is explainable.
- **Compatibility tests + docs + ADRs** as mandatory engineering assets.

If this architecture is followed strictly, the codebase will stay realistic for solo development while still being strong enough for future contributors, deeper workflow fidelity, and controlled growth.
