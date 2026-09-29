# OpenFlow: Requirements-Driven GHL Workflow Simulator Plan

## Direct recommendation

The proposed technology stack is suitable, but the product definition should change from **“build a complete GHL clone”** to **“build a requirements-driven, behavior-compatible workflow simulator.”** The simulator should accept controlled workflow definitions and event/contact inputs, execute them deterministically, and produce inspectable outputs such as state changes, branch decisions, scheduled resumptions, emitted messages, webhooks, and execution traces. This directly supports the stated goal of owning a reusable workflow laboratory instead of depending on a recurring subscription or short trial.

The first release should not attempt to reproduce the entire CRM. It should implement only the minimum domain objects required to execute selected workflows: contacts, tags, custom fields, opportunities, appointments, inbound events, simulated messages, and webhooks. HighLevel itself treats a workflow as a trigger followed by sequential actions, with optional filters, re-entry rules, branches, waits, and logs; these semantics—not the surrounding CRM screens—are the correct initial compatibility target.[^1][^2][^3]

## Product boundary

The simulator should promise **behavioral compatibility for explicitly supported scenarios**, not universal HighLevel parity. Official documentation reveals public behavior, but it does not expose every internal rule, race condition, retry policy, or implementation detail. Without running authorized reference experiments against the real platform, “exactly identical” behavior cannot be proven; the defensible claim is that a scenario conforms to a documented OpenFlow specification and, where reference traces exist, matches those observed traces.

The product can therefore be described as:

> An independently designed workflow modeling, simulation, validation, and trace-analysis environment inspired by CRM automation systems, with optional compatibility profiles for documented HighLevel workflow behavior.

This wording keeps the objective precise while avoiding a misleading claim that the application *is* HighLevel. HighLevel’s terms prohibit reverse engineering, attempts to uncover source code or underlying algorithms, and unauthorized derivative works, so development should rely on public documentation, authorized API use, and independently written code and assets.[^4]

## What to reproduce

| Layer | Reproduce closely | Do not reproduce |
|---|---|---|
| Workflow semantics | Trigger matching, filters, enrollment, re-entry, ordered actions, branches, waits, goals, workflow chaining, failures, retries, and execution status | Undocumented internal algorithms presented as facts |
| Inputs | Contact/event payloads, workflow variables, clock/timezone, trigger filters, and integration responses | Proprietary customer data or copied platform fixtures |
| Outputs | State mutations, decisions, scheduled jobs, message/webhook intents, errors, and full execution traces | Real email/SMS charges in the initial version |
| Builder | Canvas, nodes, edges, configuration panels, validation, test controls, and trace overlays | Pixel-for-pixel HighLevel layout, branding, icons, text, or assets |
| CRM | Minimal records needed by workflows | Full funnels, websites, billing, reputation, social posting, and unrelated agency features |

HighLevel’s current advanced builder supports a freeform visual canvas, multiple trigger paths, parallel branches, and a configurable default path. These are useful long-term compatibility targets, but the MVP should first support a directed workflow with deterministic conditional branches before adding arbitrary parallelism.[^5]

## Core simulator contract

Every simulation should be a reproducible function of five inputs:

```text
SimulationResult = Execute(
  PublishedWorkflowVersion,
  InitialDomainState,
  TriggerEvent,
  SimulationClock,
  IntegrationFixtures
)
```

The result should contain:

- Final domain state.
- Ordered execution steps.
- Trigger match or rejection reasons.
- Branch decisions and evaluated operands.
- Scheduled resumptions.
- Simulated outbound effects.
- Errors, retries, and skipped steps.
- A deterministic trace identifier.
- The workflow version and fixture-set version used.

This trace-first approach is essential. HighLevel exposes enrollment history and execution logs to explain whether a contact entered and whether later actions were skipped or failed. Its newer trigger statistics also distinguish attempted, matched, and unmatched events and provide contact-level mismatch reasons, which confirms that explainability belongs in the core model rather than being treated as a later UI feature.[^6][^7][^1]

## Three execution modes

| Mode | Purpose | External effects | Clock |
|---|---|---|---|
| Step mode | Debug one node at a time and inspect state diffs | Never | Manually advanced |
| Fast simulation | Complete hours or weeks of workflow time in seconds | Replaced by fixtures and recorded intents | Virtual clock |
| Live sandbox | Validate selected test integrations | Only allowlisted sandbox endpoints | Real clock |

**Fast simulation is the feature that makes OpenFlow more valuable than merely cloning a builder.** A five-day wait should not require five real days. The engine should store a logical due time and let the user advance the virtual clock to the next scheduled event.

Real email, SMS, calls, payments, and production webhooks should be excluded from the first release. An action such as `SendSms` should initially create an `OutboundMessageIntent` containing the rendered recipient, body, channel, and metadata. A webhook action should evaluate the request but send it only to a mock transport that returns a configured fixture response. HighLevel’s custom webhook guidance acknowledges real provider failures such as rate limiting and the need for delays or retries, so those outcomes should become configurable simulator fixtures rather than uncontrolled external behavior.[^8]

## Architecture decision

The original stack should be retained with one important refinement: use a **modular monolith with two executable hosts**—API and Worker—sharing the same Application, Domain, and Infrastructure projects. This remains one system, one repository, and one PostgreSQL database; it is not microservices.

```text
Next.js Builder
      |
      | REST
      v
OpenFlow.Api -----------------------------+
      |                                   |
      v                                   v
Application + Domain               PostgreSQL 18
      ^                                   ^
      |                                   |
OpenFlow.Worker ---------------------------+
```

During the earliest local prototype, the worker can run as a hosted service inside the API. Once waits and queued executions become important, running `OpenFlow.Worker` as a separate process prevents API restarts from interrupting background polling while preserving the simple architecture. .NET’s `BackgroundService` is intended for long-running hosted work, and scoped dependencies such as an EF Core `DbContext` must be resolved through an explicitly created scope because hosted services do not receive a scope automatically.[^9][^10][^11]

PostgreSQL can serve as the initial durable work queue. Workers can claim due rows transactionally with row locking and `SKIP LOCKED`, which causes already-locked candidate rows to be skipped instead of making another worker wait. Each claimed task should have a lease expiration so an interrupted worker does not leave it permanently stuck.[^12][^13]

## Stack status

| Concern | Decision | Guidance |
|---|---|---|
| Frontend | Next.js App Router + TypeScript | Keep; current installation documentation lists Node.js 20.9 as the minimum.[^14] |
| Canvas | `@xyflow/react` | Keep; store semantic graph data separately from viewport/layout data. React Flow supports saving nodes, edges, and viewport state.[^15][^16] |
| UI state | Zustand | Keep for transient editor state only. |
| Server state | TanStack Query | Keep for API caching, mutations, and invalidation. |
| Backend | ASP.NET Core 10 | Keep; .NET 10 is an active LTS release supported through November 2028.[^17][^18] |
| ORM | EF Core 10 | Keep; align its major version with .NET 10.[^19][^20] |
| Database | PostgreSQL 18 | Keep; PostgreSQL 18 is a generally available release, not a beta.[^21] |
| Background work | `BackgroundService` + PostgreSQL queue | Keep for this scale; design leases and idempotency from day one. |
| Auth | ASP.NET Core Identity + policies | Add only after the single-user simulator loop works. |
| Testing | xUnit + Playwright | Add domain tests first, API integration tests second, browser tests for critical builder paths. |
| Local runtime | Docker Compose | Use for PostgreSQL and optional local service mocks; run frontend/backend directly while debugging if faster. |

Exact patch versions should be pinned when the repository is created through lockfiles, `global.json`, project package versions, and the container image digest or patch tag. The architecture specification should name supported major versions; dependency automation can propose tested patch upgrades rather than freezing an old patch forever.

## Domain separation

The builder graph and executable workflow must not be the same object. React Flow nodes contain presentation concerns such as coordinates and selection, while the execution engine needs stable node identifiers, typed configuration, validated ports, and deterministic transition rules.

Use four representations:

1. **Draft definition** — editable semantic nodes and edges.
2. **Canvas layout** — positions, viewport, grouping, and collapsed state.
3. **Published version** — immutable, validated execution definition.
4. **Execution state** — runtime cursor, context, attempts, waits, and trace.

Publishing should compile a draft into an immutable version. Existing executions must remain attached to the version on which they started; editing the draft must never silently change an in-flight execution. HighLevel’s public API exposes workflow status and version metadata, and its marketplace trigger/action model also uses immutable keys plus separately managed versions, supporting versioning as a first-class concept.[^22][^23][^24]

## Minimal domain model

```text
Workflow
- Id, Name, Status, CurrentDraftVersionId, PublishedVersionId

WorkflowVersion
- Id, WorkflowId, VersionNumber, DefinitionJson, CreatedAt, PublishedAt

WorkflowNode
- Id, TypeKey, SchemaVersion, ConfigurationJson

WorkflowEdge
- Id, SourceNodeId, SourcePort, TargetNodeId, Priority

SimulationRun
- Id, WorkflowVersionId, Mode, ClockStart, Status, InputSnapshot

Execution
- Id, SimulationRunId, SubjectId?, CurrentNodeId, Status, ContextJson

ExecutionStep
- Id, ExecutionId, NodeId, Attempt, Input, Output, StateDiff, Status, Error

ScheduledTask
- Id, ExecutionId, NodeId, DueAt, Status, LeaseOwner, LeaseUntil, Attempts

EffectIntent
- Id, ExecutionStepId, Type, Request, FixtureResponse, Status
```

Node-specific tables should not be created for every action during the MVP. Store versioned typed configuration as JSON while keeping identity, status, scheduling, ownership, and timestamps in relational columns. This avoids dozens of sparse tables while preserving queryable execution infrastructure.

## Execution invariants

The engine should enforce these rules from its first implementation:

- **Immutable versions:** executions reference a published version forever.
- **At-least-once processing:** a claimed task may run again after a crash.
- **Idempotent effects:** every effect uses a deterministic idempotency key such as `executionId:nodeId:attemptPurpose`.
- **Transactional checkpointing:** node result, state mutation, next transition, and new scheduled task are persisted atomically where practical.
- **Explicit statuses:** `Pending`, `Running`, `Waiting`, `Completed`, `Failed`, `Cancelled`, and `Skipped`.
- **Bounded retries:** retry policy is per node type, with the final failure visible in the trace.
- **Loop protection:** cap executed steps and detect invalid cycles unless the workflow explicitly permits repetition.
- **Timezone ownership:** store instants in UTC, but evaluate schedules using the workflow/account timezone.
- **No hidden side effects:** every external operation becomes an inspectable effect intent.

These rules are more important than immediately adding Redis or Temporal. PostgreSQL row locks, unique constraints, and `ON CONFLICT` can support safe claiming and deduplication at this scale.[^13][^25][^26]

## MVP node set

The first vertical slice should implement only enough node types to prove the full execution lifecycle:

| Order | Node type | MVP behavior |
|---|---|---|
| 1 | Manual/Test Trigger | Starts a run from a supplied contact and event payload. |
| 2 | Event Trigger + filters | Reports matched/unmatched and the exact predicate results. |
| 3 | Set Contact Field | Mutates simulated domain state and records the before/after diff. |
| 4 | Add/Remove Tag | Demonstrates list-state mutation and idempotency. |
| 5 | If/Else | Routes through named `true` and `false` ports. |
| 6 | Wait Duration | Creates a durable scheduled task and resumes under a virtual or real clock. |
| 7 | Send Message (simulated) | Renders a message intent without sending it. |
| 8 | Webhook (mocked) | Builds a request and consumes a fixture response. |
| 9 | Goal | Moves or resolves the execution according to specified goal semantics. |
| 10 | End | Completes the execution with a reason. |

The wait system must eventually support more than a simple delay. HighLevel currently documents waits for durations, specific dates, recurring schedules, appointments, replies, user/contact actions, and conditions. Those variants should be added only after duration waits, cancellation, resumption, and virtual-time tests are reliable.[^27]

Goal behavior also requires an explicit specification. HighLevel documents goals that can move a contact to the goal step when a condition occurs, along with behavior choices such as ending, continuing, or waiting when the condition has not been met. OpenFlow should encode each of these choices as named policies rather than burying them in handler code.[^28]

## Compatibility specification

Create one Markdown specification per behavior, plus machine-readable fixtures:

```text
docs/compatibility/
  enrollment/
    re-entry.md
    active-contact.md
  nodes/
    if-else.md
    wait-duration.md
    goal.md
  scheduling/
    timezone.md
    daylight-saving.md
  failures/
    retries.md
    skipped-node.md

tests/fixtures/
  wait-duration/
    basic-hours.case.json
    daylight-saving.case.json
  if-else/
    missing-field.case.json
```

Each specification should include: supported scope, inputs, preconditions, predicate rules, state transitions, outputs, error behavior, timing behavior, examples, unknowns, and evidence source. Mark uncertain semantics as `Unverified` instead of guessing.

A compatibility matrix should use these levels:

- **Specified:** OpenFlow behavior is fully documented and tested.
- **Document-matched:** behavior is based on current official documentation.
- **Reference-matched:** observed output matches an authorized HighLevel test trace.
- **Approximate:** intended outcome matches but timing/error details may differ.
- **Unsupported:** the workflow is rejected at validation time.

## Golden-case validation

For every supported scenario, store a complete case file containing the initial state, workflow version, event, clock, fixtures, expected steps, expected final state, and expected effects. A case runner should execute the file headlessly in xUnit, while the UI should let the user open the same case and inspect it visually.

```json
{
  "caseId": "lead-score-qualified-v1",
  "clock": "2026-09-28T09:00:00+08:00",
  "contact": { "id": "c1", "score": 80, "tags": [] },
  "event": { "type": "ContactUpdated", "field": "score" },
  "expected": {
    "path": ["trigger", "score-check", "add-qualified", "end"],
    "contact": { "tags": ["qualified"] },
    "effects": []
  }
}
```

If temporary authorized access to HighLevel is ever used, it should be used to create a small number of lawful black-box reference traces using synthetic contacts and non-production integrations. HighLevel itself provides workflow testing with a selected contact and recommends checking execution logs, enrollment history, filters, re-entry, and representative scenarios. Those traces should record observable inputs and outputs only, not copied source, private assets, or attempts to discover internals.[^29][^2][^1]

## Correct project structure

```text
OpenFlow/
├── apps/
│   ├── web/                         # Next.js
│   ├── api/                         # OpenFlow.Api executable
│   └── worker/                      # OpenFlow.Worker executable
├── src/
│   ├── OpenFlow.Domain/
│   │   ├── Workflows/
│   │   ├── Executions/
│   │   ├── Simulation/
│   │   └── Contacts/
│   ├── OpenFlow.Application/
│   │   ├── WorkflowDesign/
│   │   ├── WorkflowPublishing/
│   │   ├── WorkflowExecution/
│   │   └── SimulationRuns/
│   ├── OpenFlow.Infrastructure/
│   │   ├── Persistence/
│   │   ├── Scheduling/
│   │   └── EffectTransports/
│   └── OpenFlow.Contracts/
├── tests/
│   ├── OpenFlow.Domain.Tests/
│   ├── OpenFlow.Application.Tests/
│   ├── OpenFlow.IntegrationTests/
│   ├── OpenFlow.CompatibilityTests/
│   └── OpenFlow.E2E/
├── docs/
│   ├── architecture/
│   ├── compatibility/
│   ├── adr/
│   └── product/
├── tests/fixtures/
├── compose.yaml
└── OpenFlow.slnx
```

This structure supports small, focused files and strong separation without creating independently deployed business services, which aligns with the preferred maintainability and debugging constraints.

## Implementation sequence

### Phase 0: Freeze semantics

Write the product charter, compatibility-level definitions, node contract, execution statuses, workflow-version rules, and simulator modes. Build a matrix of candidate HighLevel behaviors from official documentation, but choose only one trigger and five to eight MVP nodes for implementation.

### Phase 1: Headless engine

Implement workflow validation, publishing, in-memory execution, `If/Else`, state mutation, deterministic traces, and JSON golden cases. There should be no React Flow canvas yet; prove that a workflow definition can execute correctly from an xUnit test and return a complete trace.

### Phase 2: Persistence and time

Add PostgreSQL, immutable workflow versions, execution steps, scheduled tasks, leases, wait/resume behavior, idempotency keys, and the virtual clock. Run crash-recovery tests that stop a worker after claiming or partially processing work, then verify safe resumption.

### Phase 3: Visual debugger

Add the Next.js/React Flow builder, schema-driven configuration panels, validation markers, save/publish controls, run controls, and an execution overlay. Clicking a completed node should display its input snapshot, output, state diff, duration, and routing decision.

### Phase 4: Mock effects

Add simulated messages and fixture-driven webhooks. Provide scenario controls for success, timeout, HTTP error, malformed response, and retryable failure.

### Phase 5: Selected compatibility

Implement re-entry rules, goals, workflow chaining, appointment-relative waits, and multiple branches only when their specifications and fixtures are ready. HighLevel’s scheduler also demonstrates that contactless workflows may skip contact-dependent actions while continuing with supported steps; this should be treated as a separate execution-context feature, not assumed in the contact-based MVP.[^30]

## Acceptance criteria

The MVP is complete when a user can:

1. Create a workflow with a trigger, mutation, condition, wait, simulated message, and end node.
2. Publish an immutable version.
3. Supply a synthetic contact and trigger event.
4. Run in step mode and inspect every decision and state difference.
5. Advance virtual time to resume the wait immediately.
6. Observe the simulated message without contacting a real provider.
7. Re-run the exact case and obtain the same trace outcome.
8. Change the draft without altering the first run’s historical definition.
9. Restart the worker during a wait and resume without duplicate effects.
10. Export the case, workflow definition, and trace as JSON.

## Decisions to lock now

- Product category: workflow simulator and compatibility laboratory, not a full GHL clone.
- Initial fidelity target: selected workflow semantics, not broad CRM parity.
- UI target: independently branded and designed, with familiar workflow-builder interaction patterns.
- Effects policy: simulated by default; allowlisted sandbox integrations later.
- Architecture: Next.js, ASP.NET Core 10 modular monolith, PostgreSQL 18, API host, and Worker host.
- Runtime correctness: immutable versions, durable checkpoints, idempotency, leases, virtual time, and traces.
- Validation policy: specification fixtures first; authorized black-box reference traces only where available.
- MVP priority: headless engine before visual builder.

The most important correction to the earlier plan is therefore not a technology change. It is a change in engineering order: **specification → headless deterministic engine → durable scheduling → visual debugger → expanded compatibility**. Starting with a polished canvas would produce an impressive diagram editor; starting with executable specifications produces the simulator that the project actually needs.

---

## References

1. [Workflow Trigger - Call Details](https://help.gohighlevel.com/support/solutions/articles/48001212511-workflow-trigger-call-details) - The Call Details workflow trigger lets HighLevel respond automatically when a call matches specific ...

2. [Getting Started with Workflows in HighLevel](https://help.gohighlevel.com/support/solutions/articles/155000002288-getting-started-with-workflows) - Webhooks (Trigger & Action). Webhooks allow HighLevel to communicate with external systems and autom...

3. [A List of Workflow Actions](https://help.gohighlevel.com/support/solutions/articles/155000002294-what-are-workflow-actions-complete-list-) - Workflow Actions in HighLevel are pivotal components that facilitate the automation and management o...

4. [Terms of Service | HighLevel](https://www.gohighlevel.com/terms-of-service) - THIS AGREEMENT CONTAINS A MANDATORY ARBITRATION CLAUSE AND A CLASS ACTION WAIVER THAT WAIVES YOUR RI...

5. [Advanced Builder for Workflows in HighLevel | Visual Canvas](https://help.gohighlevel.com/support/solutions/articles/155000006635-advanced-builder-for-workflows) - Learn how to use HighLevel's Advanced Workflow Builder. Build on a freeform canvas with multiple tri...

6. [Workflows- Improved Execution Logs & Enrollment History](https://help.gohighlevel.com/support/solutions/articles/155000003992-workflows-improved-execution-logs-enrollment-history) - This article walks you through the latest enhancements to Execution Logs and Enrollment History in W...

7. [Workflow Trigger Narration and Statistics](https://help.gohighlevel.com/support/solutions/articles/155000006636-workflow-trigger-narration-and-statistics) - The Trigger Statistics & Narration view provides insights into how your workflow triggers perform, h...

8. [Workflow Action - Custom webhook](https://help.gohighlevel.com/support/solutions/articles/155000003305-workflow-action-custom-webhook) - Use Test Workflow (draft mode) with a sample record to trigger the action. ... 429 Rate limited → sl...

9. [Use scoped services within a BackgroundService - .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/scoped-service) - To use scoped services within a BackgroundService , create an async scope with the CreateAsyncScope ...

10. [Background tasks with hosted services in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services?view=aspnetcore-10.0) - A hosted service is a class with background task logic that implements the IHostedService interface....

11. [Dependency injection - .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/overview) - To achieve scoping services within implementations of IHostedService, such as the BackgroundService,...

12. [PostgreSQL: Documentation: 18: SELECT](https://www.postgresql.org/docs/current/sql-select.html) - With SKIP LOCKED , any selected rows that cannot be immediately locked are skipped. ... locked; any ...

13. [Documentation: 18: UPDATE](https://www.postgresql.org/docs/current/sql-update.html) - If lock contention is a concern, then SKIP LOCKED can be added to the CTE to prevent multiple comman...

14. [Getting Started: Installation](https://nextjs.org/docs/app/getting-started/installation) - Before you begin, make sure your development environment meets the following requirements: Minimum N...

15. [Save and Restore](https://reactflow.dev/examples/interaction/save-and-restore) - If you want to save and restore a flow you can use the toObject function of the React Flow instance ...

16. [React Flow: Node-Based UIs in React](https://reactflow.dev/) - Highly customizable React library for workflow builders, Nodes Handles Edges Edge Labels. Save and R...

17. [NET and .NET Core official support policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core) - The only difference is the length of support. LTS releases get free support and patches for three ye...

18. [The official .NET support policy](https://dotnet.microsoft.com/en-us/platform/support/policy) - End of support .NET 10 November 11, 2025 10.0.12 September 8, 2026 LTS Active November 14, 2028. LTS...

19. [What's New in EF Core 10](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-10.0/whatsnew) - EF Core 10.0 (EF10) was released in November 2025 and is a Long Term Support (LTS) release. EF10 wil...

20. [EF Core releases and planning](https://learn.microsoft.com/en-us/ef/core/what-is-new/) - EF Core 10.0 .NET 10, November 10, 2028, What's new / Breaking changes · EF Core 9.0 .NET 8, Novembe...

21. [PostgreSQL 18 Released!](https://www.postgresql.org/about/news/postgresql-18-released-3142/) - PostgreSQL 18 improves performance for workloads of all sizes through a new I/O subsystem that has d...

22. [Creating a Marketplace Workflow Trigger | HighLevel API](https://marketplace.gohighlevel.com/docs/marketplace-modules/CustomTriggers/) - Navigate to the Workflow section, located under the Modules in the left-hand navigation menu of your...

23. [Get Workflow | HighLevel API](https://marketplace.gohighlevel.com/docs/2021-04-15/ghl/workflows/get-workflow/) - This is documentation for HighLevel API 2021-04-15, which is no longer actively maintained. For up-t...

24. [Creating a Marketplace Workflow Action | HighLevel API](https://marketplace.gohighlevel.com/docs/marketplace-modules/CustomActions/) - Navigate to the "Workflow" section, located under the Modules in the left-hand navigation menu of yo...

25. [Documentation: 18: 13.3. Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html) - Only an ACCESS EXCLUSIVE lock blocks a SELECT (without FOR UPDATE/SHARE ) statement. Once acquired, ...

26. [Documentation: 18: INSERT](https://www.postgresql.org/docs/current/sql-insert.html) - INSERT into tables that lack unique indexes will not be blocked by concurrent activity. Tables with ...

27. [Workflow Wait Action Setup and Options in HighLevel](https://help.gohighlevel.com/support/solutions/articles/155000002470-workflow-action-wait) - Learn how to use the Wait Action in HighLevel Workflows to pause contacts by delay, date, schedule, ...

28. [Goal Event Workflow Action in HighLevel](https://help.gohighlevel.com/support/solutions/articles/155000003328-workflow-action-goal-event) - Under If Contact Reaches This Goal Without Meeting Conditions, select one: End this workflow. Contin...

29. [Workflow Builder Walkthrough](https://help.gohighlevel.com/support/solutions/articles/155000001254-workflow-builder-walkthrough) - Click the Test Workflow button in the top-right corner. Select a contact for testing. Click Run Test...

30. [How to Use the Workflow Scheduler Trigger in HighLevel](https://help.gohighlevel.com/support/solutions/articles/155000006653-workflow-trigger-scheduler) - The Workflow Scheduler Trigger is a native, contactless trigger that starts a workflow on a schedule...

