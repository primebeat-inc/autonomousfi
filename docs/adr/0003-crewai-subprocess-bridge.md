# ADR 0003: CrewAI Subprocess Bridge to TypeScript SDK

## Status

Accepted 2026-05-12 for Sprint 1. SUPERSEDED-PLANNED by a long-lived HTTP service in Sprint 3 (see `docs/ROADMAP.md` Sprint 3 design and the spec section on the persistent IPC service).

## Context

The `autonomousfi` stack is split across two runtimes:

- The agent layer is Python. We use CrewAI, which only ships a Python SDK and is the framework our pilot users already run.
- The on-chain and off-chain settlement layer (MockChain, hostage escrow, payout logic, quality gating) is in TypeScript, exposed via the `@autonomousfi/sdk` workspace package. The TS SDK is the canonical source of truth for protocol semantics and is shared with the demo UI and the eventual production client.

We need a bidirectional call: CrewAI agents must invoke the SDK to (1) settle payment, (2) verify hostage stake, (3) record quality scores. Calling TS from Python at all requires a process bridge.

We are mid-Sprint 1 with a hard demo deadline. We do not have time to ship a production microservice (HTTP server, container, health checks, auth, deploy target, observability) before the deadline. The honest framing: we are accepting demo-grade infra to unblock end-to-end flow, and we will replace it.

Alternatives considered:

1. Port the SDK logic to Python. Rejected: duplicates the source of truth, doubles the audit surface, and the SDK is already changing weekly.
2. Long-lived HTTP service (FastAPI-style sidecar wrapping the SDK). This is the right answer but costs roughly a sprint of infra work we do not have. Deferred to Sprint 3.
3. Shared library via PyO3 / Node-API bindings. Rejected: build complexity is far higher than the win for a throwaway path.
4. gRPC. Same objection as HTTP, plus protobuf overhead. Rejected for Sprint 1.

## Decision

Sprint 1 ships a subprocess bridge.

Each Python-to-TS call shells out to `pnpm --filter @autonomousfi/sdk run ipc` from the repo root, passes the request as a single JSON object on stdin, and reads a single JSON object back from stdout. Implementation lives at `packages/crewai-plugin/crewai_paidagent/bridge.py`.

Constraints fixed in the implementation:

- 30 second hard timeout via `subprocess.run(..., timeout=30)`. A hung tsx child cannot wedge a CrewAI step indefinitely.
- JSON decode is wrapped: malformed stdout is converted to a structured error rather than a raw exception, so the agent loop can decide whether to retry.
- Repo root is discovered by walking up to `pnpm-workspace.yaml`, with `AUTONOMOUSFI_REPO_ROOT` as an override for non-standard layouts (CI, container).
- The bridge returns a typed `BridgeResult` (status, score, result) so callers do not couple to the raw JSON shape.
- One subprocess per call. No pooling. No persistent worker. Sprint 3 fixes this.

## Consequences

Positive:

- Zero new infrastructure. No service to deploy, no port to manage, no auth surface, no extra container in the demo environment. The bridge works on any machine that already has `pnpm` and the workspace installed.
- The TS SDK stays the single source of truth. Python never reimplements protocol logic.
- Easy to delete. When Sprint 3 lands the HTTP service, only `bridge.py` changes; the call sites in the CrewAI plugin stay stable.

Negative:

- `tsx` cold start dominates the call. Each invocation pays roughly 3 to 5 seconds of Node plus tsx startup before any SDK code runs. In a demo with five sequential agent calls this is 15 to 25 seconds of pure overhead, which is the bulk of perceived demo latency.
- Not safe for production traffic. Per-call process spawn means CPU and memory scale linearly with request rate, and concurrent invocations can starve the host. We have not measured throughput because we do not intend to operate this under load.
- Error surface is wider than a long-lived service. We have to defend against: `pnpm` missing on PATH, workspace not installed, tsx transpile errors at runtime, stdout pollution from upstream logs, and the 30s timeout firing on a legitimate slow call. Each of these has shown up at least once in testing.
- Observability is poor. We get stdout, stderr, exit code, and wall time. No structured tracing, no per-call ID propagation into the SDK, no metrics.

## Cross-references

- Implementation: `packages/crewai-plugin/crewai_paidagent/bridge.py`
- Successor design: Sprint 3 long-lived HTTP service (see `docs/ROADMAP.md` and the spec section covering the persistent SDK IPC service that will replace this bridge).
