# ADR 0001: Modular Monolith and Trace-First Execution Engine

## Context
OpenFlow requires high determinism, granular execution visibility, and rapid local iteration without the operational overhead of microservices or external orchestration engines.

## Decision
1. Adopt a modular monolith architecture with dual runtime hosts (API and Worker) sharing a clean domain and application core.
2. Require every execution transition to record an immutable `ExecutionStep` with before/after state diffs, input/output snapshots, and timing.
3. Decouple React Flow presentation objects from the semantic workflow graph domain model.
4. Utilize PostgreSQL with `SKIP LOCKED` row claiming and leases for durable asynchronous wait resumption.

## Status
Accepted.
