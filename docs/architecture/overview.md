# OpenFlow Architecture Overview

## Core System Architecture
OpenFlow is engineered as a **Modular Monolith** with:
1. **Frontend**: Next.js 15+ App Router in `apps/web`.
2. **REST API Host**: ASP.NET Core 10 Web API in `apps/api`.
3. **Background Worker Host**: ASP.NET Core 10 Worker in `apps/worker`.
4. **Application Core**: Shared class libraries in `src/`:
   - `OpenFlow.Domain`: Invariant rules, aggregates, entities, value objects.
   - `OpenFlow.Contracts`: Transport schemas, DTOs, requests, and responses.
   - `OpenFlow.Application`: Feature use cases, CQRS commands/queries, validators, and execution engine.
   - `OpenFlow.Infrastructure`: Persistence, PostgreSQL scheduling queue, and effect dispatchers.

## Execution Flow & Resumption
```text
API / Event -> StartExecutionHandler -> WorkflowExecutionEngine -> ExecutionStep (trace)
                                                                 |-> WaitNode (ScheduledTask)
                                                                       |
Worker Host (TaskPollingService) -> Postgres SKIP LOCKED claim --------+
                                 -> ResumeExecutionHandler
                                 -> WorkflowExecutionEngine -> Next Steps -> Completed
```
