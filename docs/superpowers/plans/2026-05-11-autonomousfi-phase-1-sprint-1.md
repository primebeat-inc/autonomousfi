# AutonomousFi Agent: Phase 1 / Sprint 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the AutonomousFi repository and ship a working in-memory `@paid_agent` decorator + CrewAI plugin alpha in time for the 2026-05-17 AUTON Program keynote.

**Architecture:** TypeScript monorepo (pnpm workspaces) hosting an SDK package, a CrewAI Python plugin package, a Foundry Solidity package, and a Risc0 circuits package. Sprint 1 only touches the SDK package, the CrewAI plugin package, and the keynote deck; all on-chain and ZK packages are scaffolded but left empty for Sprint 2-3. The SDK works against an in-memory mock chain so the keynote demo runs offline.

**Tech Stack:** TypeScript 5.x, pnpm workspaces, Bun runtime (for fast test loop), Vitest, fast-check (property test), Python 3.11+ with uv/poetry, CrewAI 0.x, viem (placeholder), Foundry (placeholder), Risc0 (placeholder).

**Sprint window:** 2026-05-12 (Mon) → 2026-05-24 (Sun), 13 days, includes 5/17 (Sat) AUTON keynote checkpoint.

**Resource budget:** 社長 ~6 working days available, Claude Code 24/7. Lead Engineer 牧野 NOT involved.

**Spec reference:** [`docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md`](../specs/2026-05-11-autonomous-fi-agent-design.md)

---

## Sprint 1 Acceptance Gates

By 2026-05-24 EOD, all of the following must be ✅:

- [ ] pnpm monorepo bootstrapped (`package.json` workspace root, 4 packages scaffolded)
- [ ] SDK package builds and tests green on `pnpm test`
- [ ] `@paid_agent` decorator works against an in-memory mock chain
- [ ] CrewAI plugin alpha (`crewai_paidagent`) installs and wraps a CrewAI agent
- [ ] CrewAI demo script: `python demos/agent_to_agent_review.py` completes with USDT mock settlement in <30 seconds
- [ ] GitHub repo `primebeat-inc/autonomousfi` pushed to remote with public visibility (or scheduled for 5/15 push)
- [ ] AUTON 5/17 keynote slide deck draft v1 committed at `presentations/auton-2026-05-17/`
- [ ] AUTON keynote presented 5/17, recording committed (or YouTube link)
- [ ] LICENSE file decision committed (Apache 2.0 recommended)
- [ ] CONTRIBUTING.md skeleton committed
- [ ] CI workflow (`.github/workflows/ci.yml`) green on push

If any gate is red on 2026-05-24, slip the gate to Sprint 2 and mark it explicitly in the Phase 1 outline at the bottom of this doc.

---

## File Structure (Sprint 1 scope)

Files created in Sprint 1 (everything else in Phase 1 is Sprint 2+):

```
autonomousfi/
├── package.json                                 [NEW] pnpm workspace root, lockfile-free root
├── pnpm-workspace.yaml                          [NEW] workspaces definition
├── .nvmrc                                       [NEW] node 22 LTS pin
├── .github/
│   ├── workflows/ci.yml                         [NEW] lint + build + test on push
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md                        [NEW]
│       └── feature_request.md                   [NEW]
├── LICENSE                                       [NEW] Apache 2.0
├── CONTRIBUTING.md                              [NEW] contribution guide skeleton
├── packages/
│   ├── sdk/
│   │   ├── package.json                         [NEW]
│   │   ├── tsconfig.json                        [NEW]
│   │   ├── vitest.config.ts                     [NEW]
│   │   ├── src/
│   │   │   ├── index.ts                         [NEW] public API exports
│   │   │   ├── types.ts                         [NEW] shared types
│   │   │   ├── errors.ts                        [NEW] error classes
│   │   │   ├── mock-chain.ts                    [NEW] in-memory chain for tests/demo
│   │   │   ├── paid-agent.ts                    [NEW] @paid_agent decorator
│   │   │   ├── escrow.ts                        [NEW] USDTEscrow client (mock impl)
│   │   │   ├── hostage.ts                       [NEW] HostageBond client (mock impl)
│   │   │   └── quality.ts                       [NEW] QVACQualityVerifier (stub impl)
│   │   └── test/
│   │       ├── types.test.ts                    [NEW]
│   │       ├── mock-chain.test.ts               [NEW]
│   │       ├── paid-agent.test.ts               [NEW]
│   │       ├── escrow.test.ts                   [NEW]
│   │       ├── hostage.test.ts                  [NEW]
│   │       └── e2e.test.ts                      [NEW] full agent-to-agent flow
│   ├── crewai-plugin/
│   │   ├── pyproject.toml                       [NEW]
│   │   ├── README.md                            [NEW]
│   │   ├── crewai_paidagent/
│   │   │   ├── __init__.py                      [NEW]
│   │   │   ├── plugin.py                        [NEW] PaidAgent wrapper class
│   │   │   └── bridge.py                        [NEW] HTTP bridge to TS SDK service
│   │   └── tests/
│   │       └── test_plugin.py                   [NEW]
│   ├── contracts/                                [NEW dir, empty in Sprint 1]
│   │   └── .gitkeep                             [NEW]
│   └── circuits/                                 [NEW dir, empty in Sprint 1]
│       └── .gitkeep                             [NEW]
├── demos/
│   └── agent_to_agent_review.py                 [NEW] AUTON demo script
├── presentations/
│   └── auton-2026-05-17/
│       ├── slides.md                            [NEW] keynote markdown source
│       ├── demo-recording.md                    [NEW] post-event link/file
│       └── speaker-notes.md                     [NEW] talk script
└── docs/
    └── ROADMAP.md                                [NEW] human-readable roadmap
```

**Decomposition rationale:**
- `mock-chain.ts` is a single-file in-memory ledger and is the only "magic" in Sprint 1, it lets every other SDK module unit-test against a deterministic environment without testnet calls.
- `paid-agent.ts` is the public face of the SDK; everything else exists to support it.
- `escrow.ts` / `hostage.ts` / `quality.ts` are kept as separate files now (vs. one big file) so Sprint 2 can swap the mock impl for a viem-backed impl without touching the decorator or its tests.
- Solidity (`contracts/`) and Rust (`circuits/`) directories are scaffolded but left empty so the monorepo structure does not change between Sprint 1 and Sprint 2.

---

## Skills to load before starting

- `superpowers:test-driven-development`: Sprint 1 is TDD-first
- `superpowers:verification-before-completion`: every acceptance gate must be verified, not assumed
- `everything-claude-code:typescript-reviewer`: invoke after each SDK task
- (`superpowers:executing-plans` or `superpowers:subagent-driven-development`: chosen at execution handoff)

---

## Task 0: pnpm workspace bootstrap

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `LICENSE`, `CONTRIBUTING.md`, `docs/ROADMAP.md`
- Create dir: `packages/contracts/`, `packages/circuits/`

- [ ] **Step 1: Create workspace root `package.json`**

```json
{
  "name": "autonomousfi",
  "version": "0.0.0",
  "private": true,
  "license": "Apache-2.0",
  "engines": { "node": ">=22.0.0", "pnpm": ">=9.0.0" },
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "typecheck": "pnpm -r run typecheck"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  },
  "packageManager": "pnpm@9.12.0"
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'packages/*'
```

- [ ] **Step 3: Create `.nvmrc` pinning Node 22 LTS**

```
v22.10.0
```

- [ ] **Step 4: Create `LICENSE` (Apache 2.0)**

Use the canonical Apache 2.0 text from https://www.apache.org/licenses/LICENSE-2.0.txt, with copyright line: `Copyright 2026 Prime Beat Inc.`

- [ ] **Step 5: Create `CONTRIBUTING.md`**

```markdown
# Contributing to AutonomousFi Agent

Thanks for your interest. This project is in early Phase 1; expect rapid change.

## Quick start

```bash
pnpm install
pnpm test
```

## Pull requests

- Open an issue first for non-trivial changes
- TDD: tests before implementation
- Conventional commits (`feat:`, `fix:`, `chore:`)
- One topic per PR

## Code of conduct

Be respectful. We follow the Contributor Covenant.
```

- [ ] **Step 6: Create `docs/ROADMAP.md`**

```markdown
# Roadmap

See `docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md` §12 for the authoritative roadmap.

## Sprint 1 (2026-05-12 → 05-24)
- Monorepo bootstrap
- SDK in-memory mock + `@paid_agent` decorator
- CrewAI plugin alpha
- AUTON 5/17 keynote

## Subsequent sprints
See spec §12 + `docs/superpowers/plans/` for sprint plans.
```

- [ ] **Step 7: Create empty placeholder packages**

```bash
mkdir -p packages/contracts packages/circuits
touch packages/contracts/.gitkeep packages/circuits/.gitkeep
```

- [ ] **Step 8: Verify pnpm install succeeds with empty workspace**

```bash
pnpm install
```
Expected: no errors, `pnpm-lock.yaml` created at root.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: pnpm workspace bootstrap with Apache-2.0 license"
```

---

## Task 1: SDK package skeleton + TypeScript config

**Files:**
- Create: `packages/sdk/package.json`, `packages/sdk/tsconfig.json`, `packages/sdk/vitest.config.ts`, `packages/sdk/src/index.ts`

- [ ] **Step 1: Create `packages/sdk/package.json`**

```json
{
  "name": "@autonomousfi/sdk",
  "version": "0.0.1",
  "description": "AutonomousFi SDK: agent-to-agent USDT payments with hostage reputation",
  "license": "Apache-2.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsc -b",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "echo 'lint placeholder for sprint 1'"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "fast-check": "^3.22.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `packages/sdk/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

- [ ] **Step 3: Create `packages/sdk/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      thresholds: { lines: 80, branches: 70, functions: 80, statements: 80 }
    }
  }
});
```

- [ ] **Step 4: Create placeholder `packages/sdk/src/index.ts`**

```ts
export const SDK_VERSION = '0.0.1';
```

- [ ] **Step 5: Install SDK dev deps and verify build**

```bash
pnpm --filter @autonomousfi/sdk install
pnpm --filter @autonomousfi/sdk run typecheck
pnpm --filter @autonomousfi/sdk run build
```
Expected: `dist/index.js` and `dist/index.d.ts` created, no type errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(sdk): typescript package skeleton with vitest"
```

---

## Task 2: Shared types (`types.ts`)

**Files:**
- Create: `packages/sdk/src/types.ts`, `packages/sdk/test/types.test.ts`

- [ ] **Step 1: Write failing test `packages/sdk/test/types.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  scoreToScaled,
  scaledToScore,
  isValidPrice,
  type TaskId,
  type Price
} from '../src/types.js';

describe('scoreToScaled / scaledToScore', () => {
  it('round-trips 0.5 exactly', () => {
    expect(scaledToScore(scoreToScaled(0.5))).toBe(0.5);
  });

  it('clamps over-range scores to [0, 1]', () => {
    expect(scoreToScaled(1.5)).toBe(1_000_000);
    expect(scoreToScaled(-0.2)).toBe(0);
  });

  it('uses 1e6 fixed-point scale matching spec §7.1', () => {
    expect(scoreToScaled(0.85)).toBe(850_000);
  });
});

describe('isValidPrice', () => {
  it('accepts positive bigint up to 2^64-1', () => {
    expect(isValidPrice(1n)).toBe(true);
    expect(isValidPrice(2n ** 64n - 1n)).toBe(true);
  });

  it('rejects zero, negative, or oversized prices', () => {
    expect(isValidPrice(0n)).toBe(false);
    expect(isValidPrice(-1n)).toBe(false);
    expect(isValidPrice(2n ** 64n)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pnpm --filter @autonomousfi/sdk test
```
Expected: errors about `types.ts` not exporting the named functions/types.

- [ ] **Step 3: Implement `packages/sdk/src/types.ts`**

```ts
/**
 * Shared types for the AutonomousFi SDK.
 *
 * The score fixed-point scale (1e6) matches the binding decision in
 * spec §7.1 to keep TypeScript SDK and Risc0 guest program in sync.
 */

export type TaskId = string & { readonly __brand: 'TaskId' };
export type AgentAddress = `0x${string}` & { readonly __brand: 'AgentAddress' };
export type Price = bigint & { readonly __brand: 'Price' };

export const SCORE_SCALE = 1_000_000;
const MAX_U64 = 2n ** 64n - 1n;

export function scoreToScaled(score: number): number {
  if (score >= 1) return SCORE_SCALE;
  if (score <= 0) return 0;
  return Math.round(score * SCORE_SCALE);
}

export function scaledToScore(scaled: number): number {
  return scaled / SCORE_SCALE;
}

export function isValidPrice(price: bigint): boolean {
  return price > 0n && price <= MAX_U64;
}

export interface TaskSpec {
  readonly taskHash: `0x${string}`;
  readonly description: string;
  readonly inputs: Record<string, unknown>;
}

export interface TaskCompletion {
  readonly taskHash: `0x${string}`;
  readonly providerAddress: AgentAddress;
  readonly requesterAddress: AgentAddress;
  readonly scoreScaled: number;
  readonly counterpartySig: `0x${string}`;
}

export interface PaidAgentConfig {
  readonly price: Price;
  readonly stake: Price;
  readonly qualityThreshold: number;
  readonly deadlineMs: number;
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
pnpm --filter @autonomousfi/sdk test
```
Expected: all `types.test.ts` tests pass.

- [ ] **Step 5: Property test edge cases via fast-check**

Add to `packages/sdk/test/types.test.ts`:

```ts
import fc from 'fast-check';

describe('scoreToScaled property: monotonicity', () => {
  it('is non-decreasing in input', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (a, b) => {
          if (a <= b) {
            expect(scoreToScaled(a)).toBeLessThanOrEqual(scoreToScaled(b));
          }
        }
      )
    );
  });
});
```

- [ ] **Step 6: Run test to confirm pass**

```bash
pnpm --filter @autonomousfi/sdk test
```
Expected: property test passes 100 generated cases.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(sdk): shared types with 1e6 fixed-point score encoding"
```

---

## Task 3: Mock chain (`mock-chain.ts`)

**Files:**
- Create: `packages/sdk/src/mock-chain.ts`, `packages/sdk/src/errors.ts`, `packages/sdk/test/mock-chain.test.ts`

- [ ] **Step 1: Write failing test for `MockChain`**

`packages/sdk/test/mock-chain.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MockChain } from '../src/mock-chain.js';
import { type AgentAddress, type Price } from '../src/types.js';

const A: AgentAddress = '0xAAAA' as AgentAddress;
const B: AgentAddress = '0xBBBB' as AgentAddress;
const TASK_HASH = '0xfeedface' as const;

describe('MockChain: balances', () => {
  let chain: MockChain;
  beforeEach(() => { chain = new MockChain(); });

  it('starts with zero balance for unknown address', () => {
    expect(chain.getUsdtBalance(A)).toBe(0n);
  });

  it('mints USDT to an address', () => {
    chain.mintUsdt(A, 100n);
    expect(chain.getUsdtBalance(A)).toBe(100n);
  });
});

describe('MockChain: escrow', () => {
  it('locks funds into an escrow and lets release pay the provider', () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.escrowLock({ taskHash: TASK_HASH, requester: A, provider: B, price: 100n as Price });
    expect(chain.getUsdtBalance(A)).toBe(900n);
    expect(chain.getEscrowStatus(TASK_HASH)).toBe('locked');

    chain.escrowRelease(TASK_HASH);
    expect(chain.getUsdtBalance(B)).toBe(100n);
    expect(chain.getEscrowStatus(TASK_HASH)).toBe('released');
  });

  it('rejects releasing an already-released escrow', () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.escrowLock({ taskHash: TASK_HASH, requester: A, provider: B, price: 100n as Price });
    chain.escrowRelease(TASK_HASH);
    expect(() => chain.escrowRelease(TASK_HASH)).toThrow(/already released/);
  });

  it('rejects locking when requester has insufficient balance', () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 50n);
    expect(() =>
      chain.escrowLock({ taskHash: TASK_HASH, requester: A, provider: B, price: 100n as Price })
    ).toThrow(/insufficient balance/);
  });
});

describe('MockChain: hostage stake', () => {
  it('stakes from provider balance and slashes to requester on failure', () => {
    const chain = new MockChain();
    chain.mintUsdt(B, 200n);
    chain.hostageStake({ taskHash: TASK_HASH, provider: B, stake: 50n as Price });
    expect(chain.getUsdtBalance(B)).toBe(150n);
    chain.hostageSlash(TASK_HASH, A);
    expect(chain.getUsdtBalance(A)).toBe(50n);
  });

  it('refunds stake on success', () => {
    const chain = new MockChain();
    chain.mintUsdt(B, 200n);
    chain.hostageStake({ taskHash: TASK_HASH, provider: B, stake: 50n as Price });
    chain.hostageRefund(TASK_HASH);
    expect(chain.getUsdtBalance(B)).toBe(200n);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pnpm --filter @autonomousfi/sdk test
```
Expected: errors about `mock-chain.ts` not existing.

- [ ] **Step 3: Create `packages/sdk/src/errors.ts`**

```ts
export class AutonomousFiError extends Error {
  constructor(public readonly code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'AutonomousFiError';
  }
}

export const ERR_INSUFFICIENT_BALANCE = 'insufficient balance';
export const ERR_ALREADY_RELEASED = 'escrow already released';
export const ERR_ALREADY_REFUNDED = 'escrow already refunded';
export const ERR_UNKNOWN_TASK = 'unknown task';
export const ERR_QUALITY_BELOW_THRESHOLD = 'quality below threshold';
```

- [ ] **Step 4: Implement `packages/sdk/src/mock-chain.ts`**

```ts
import { AutonomousFiError, ERR_INSUFFICIENT_BALANCE, ERR_ALREADY_RELEASED, ERR_ALREADY_REFUNDED, ERR_UNKNOWN_TASK } from './errors.js';
import type { AgentAddress, Price } from './types.js';

type EscrowStatus = 'locked' | 'released' | 'refunded';
type HostageStatus = 'staked' | 'refunded' | 'slashed';

interface EscrowRecord {
  requester: AgentAddress;
  provider: AgentAddress;
  price: Price;
  status: EscrowStatus;
}

interface HostageRecord {
  provider: AgentAddress;
  stake: Price;
  status: HostageStatus;
}

export interface EscrowLockInput {
  taskHash: `0x${string}`;
  requester: AgentAddress;
  provider: AgentAddress;
  price: Price;
}

export interface HostageStakeInput {
  taskHash: `0x${string}`;
  provider: AgentAddress;
  stake: Price;
}

/**
 * In-memory deterministic chain used by SDK unit tests and the AUTON keynote demo.
 * Real on-chain integration replaces this in Sprint 2-3 (see spec §5.2).
 */
export class MockChain {
  private readonly balances = new Map<AgentAddress, bigint>();
  private readonly escrows = new Map<string, EscrowRecord>();
  private readonly hostages = new Map<string, HostageRecord>();

  getUsdtBalance(addr: AgentAddress): bigint {
    return this.balances.get(addr) ?? 0n;
  }

  mintUsdt(addr: AgentAddress, amount: bigint): void {
    this.balances.set(addr, this.getUsdtBalance(addr) + amount);
  }

  private debit(addr: AgentAddress, amount: bigint): void {
    const current = this.getUsdtBalance(addr);
    if (current < amount) {
      throw new AutonomousFiError(ERR_INSUFFICIENT_BALANCE, `${addr} has ${current}, needs ${amount}`);
    }
    this.balances.set(addr, current - amount);
  }

  private credit(addr: AgentAddress, amount: bigint): void {
    this.balances.set(addr, this.getUsdtBalance(addr) + amount);
  }

  escrowLock(input: EscrowLockInput): void {
    this.debit(input.requester, input.price);
    this.escrows.set(input.taskHash, {
      requester: input.requester,
      provider: input.provider,
      price: input.price,
      status: 'locked'
    });
  }

  escrowRelease(taskHash: `0x${string}`): void {
    const rec = this.escrows.get(taskHash);
    if (!rec) throw new AutonomousFiError(ERR_UNKNOWN_TASK, taskHash);
    if (rec.status === 'released') throw new AutonomousFiError(ERR_ALREADY_RELEASED, taskHash);
    if (rec.status === 'refunded') throw new AutonomousFiError(ERR_ALREADY_REFUNDED, taskHash);
    this.credit(rec.provider, rec.price);
    rec.status = 'released';
  }

  escrowRefund(taskHash: `0x${string}`): void {
    const rec = this.escrows.get(taskHash);
    if (!rec) throw new AutonomousFiError(ERR_UNKNOWN_TASK, taskHash);
    if (rec.status === 'released') throw new AutonomousFiError(ERR_ALREADY_RELEASED, taskHash);
    if (rec.status === 'refunded') throw new AutonomousFiError(ERR_ALREADY_REFUNDED, taskHash);
    this.credit(rec.requester, rec.price);
    rec.status = 'refunded';
  }

  getEscrowStatus(taskHash: `0x${string}`): EscrowStatus | 'unknown' {
    return this.escrows.get(taskHash)?.status ?? 'unknown';
  }

  hostageStake(input: HostageStakeInput): void {
    this.debit(input.provider, input.stake);
    this.hostages.set(input.taskHash, {
      provider: input.provider,
      stake: input.stake,
      status: 'staked'
    });
  }

  hostageRefund(taskHash: `0x${string}`): void {
    const rec = this.hostages.get(taskHash);
    if (!rec) throw new AutonomousFiError(ERR_UNKNOWN_TASK, taskHash);
    if (rec.status !== 'staked') throw new AutonomousFiError(ERR_ALREADY_RELEASED, taskHash);
    this.credit(rec.provider, rec.stake);
    rec.status = 'refunded';
  }

  hostageSlash(taskHash: `0x${string}`, recipient: AgentAddress): void {
    const rec = this.hostages.get(taskHash);
    if (!rec) throw new AutonomousFiError(ERR_UNKNOWN_TASK, taskHash);
    if (rec.status !== 'staked') throw new AutonomousFiError(ERR_ALREADY_RELEASED, taskHash);
    this.credit(recipient, rec.stake);
    rec.status = 'slashed';
  }
}
```

- [ ] **Step 5: Run test to confirm pass**

```bash
pnpm --filter @autonomousfi/sdk test
```
Expected: all `mock-chain.test.ts` tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(sdk): in-memory MockChain for escrow + hostage flows"
```

---

## Task 4: `QVACQualityVerifier` stub

**Files:**
- Create: `packages/sdk/src/quality.ts`, `packages/sdk/test/quality.test.ts`

- [ ] **Step 1: Write failing test**

`packages/sdk/test/quality.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { QVACQualityVerifier, StubLLMJudge } from '../src/quality.js';
import { scoreToScaled } from '../src/types.js';

describe('QVACQualityVerifier with StubLLMJudge', () => {
  it('returns a high score when result matches expected', async () => {
    const verifier = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.95 }));
    const score = await verifier.evaluate(
      { taskHash: '0xabc', description: 'review this code', inputs: {} },
      'looks good'
    );
    expect(scoreToScaled(score)).toBe(950_000);
  });

  it('returns a low score for the explicit failure marker', async () => {
    const verifier = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.95, failOn: 'BAD' }));
    const score = await verifier.evaluate(
      { taskHash: '0xabc', description: 'review this code', inputs: {} },
      'BAD'
    );
    expect(score).toBeLessThan(0.5);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
pnpm --filter @autonomousfi/sdk test
```
Expected: fails because `quality.ts` does not exist.

- [ ] **Step 3: Implement `packages/sdk/src/quality.ts`**

```ts
import type { TaskSpec } from './types.js';

/**
 * Sprint 1 stub. Sprint 5 swaps this for a real QVAC-driven local LLM judge
 * (Llama 3.1 8B Instruct baseline, see spec §5.1).
 */
export interface QualityJudge {
  judge(spec: TaskSpec, result: string): Promise<number>; // returns score in [0,1]
}

export interface StubLLMJudgeOptions {
  readonly matchScore: number;
  readonly failOn?: string;
}

export class StubLLMJudge implements QualityJudge {
  constructor(private readonly opts: StubLLMJudgeOptions) {}

  async judge(_spec: TaskSpec, result: string): Promise<number> {
    if (this.opts.failOn !== undefined && result.includes(this.opts.failOn)) {
      return 0.1;
    }
    return this.opts.matchScore;
  }
}

export class QVACQualityVerifier {
  constructor(private readonly judge: QualityJudge) {}

  async evaluate(spec: TaskSpec, result: string): Promise<number> {
    return this.judge.judge(spec, result);
  }
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
pnpm --filter @autonomousfi/sdk test
```
Expected: all `quality.test.ts` tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(sdk): QVACQualityVerifier with stub LLM judge"
```

---

## Task 5: `@paid_agent` decorator + e2e flow

**Files:**
- Create: `packages/sdk/src/paid-agent.ts`, `packages/sdk/test/paid-agent.test.ts`, `packages/sdk/test/e2e.test.ts`

- [ ] **Step 1: Write failing e2e test (the demo-day acceptance contract)**

`packages/sdk/test/e2e.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { MockChain } from '../src/mock-chain.js';
import { paidAgent } from '../src/paid-agent.js';
import { QVACQualityVerifier, StubLLMJudge } from '../src/quality.js';
import type { AgentAddress, Price } from '../src/types.js';

const A: AgentAddress = '0xAAAA' as AgentAddress;
const B: AgentAddress = '0xBBBB' as AgentAddress;

describe('e2e: requester pays provider through @paid_agent', () => {
  it('settles successfully when QVAC judge approves', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);

    const judge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.92 }));

    const reviewCode = paidAgent(
      {
        price: 100n as Price,
        stake: 50n as Price,
        qualityThreshold: 0.85,
        deadlineMs: 60_000,
        providerAddress: B,
        chain,
        judge
      },
      async (snippet: string) => `Reviewed: ${snippet}, looks good`
    );

    const out = await reviewCode.call(A, { snippet: 'function add(a,b){return a+b}' });

    expect(out.status).toBe('settled');
    expect(out.score).toBeGreaterThanOrEqual(0.85);
    expect(chain.getUsdtBalance(A)).toBe(900n);
    expect(chain.getUsdtBalance(B)).toBe(1_100n);
  });

  it('slashes provider when judge fails', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);

    const judge = new QVACQualityVerifier(
      new StubLLMJudge({ matchScore: 0.9, failOn: 'TERRIBLE' })
    );

    const reviewCode = paidAgent(
      {
        price: 100n as Price,
        stake: 50n as Price,
        qualityThreshold: 0.85,
        deadlineMs: 60_000,
        providerAddress: B,
        chain,
        judge
      },
      async () => 'TERRIBLE OUTPUT'
    );

    const out = await reviewCode.call(A, { snippet: 'whatever' });

    expect(out.status).toBe('slashed');
    expect(chain.getUsdtBalance(A)).toBe(1_050n); // refund 100 + hostage slash 50 minus original lock
    expect(chain.getUsdtBalance(B)).toBe(950n);   // stake gone
  });
});
```

- [ ] **Step 2: Run e2e test to confirm failure**

```bash
pnpm --filter @autonomousfi/sdk test
```
Expected: fails because `paid-agent.ts` exports nothing yet.

- [ ] **Step 3: Implement `packages/sdk/src/paid-agent.ts`**

```ts
import type { MockChain } from './mock-chain.js';
import type { QVACQualityVerifier } from './quality.js';
import type { AgentAddress, Price, TaskSpec } from './types.js';

export interface PaidAgentOptions {
  readonly price: Price;
  readonly stake: Price;
  readonly qualityThreshold: number;
  readonly deadlineMs: number;
  readonly providerAddress: AgentAddress;
  readonly chain: MockChain;
  readonly judge: QVACQualityVerifier;
}

export type PaidAgentOutcome =
  | { status: 'settled'; result: string; score: number }
  | { status: 'slashed'; result: string; score: number };

export interface PaidAgentHandle<TInput> {
  call(requester: AgentAddress, input: TInput): Promise<PaidAgentOutcome>;
}

let taskCounter = 0;
function nextTaskHash(): `0x${string}` {
  taskCounter += 1;
  return `0x${taskCounter.toString(16).padStart(8, '0')}` as `0x${string}`;
}

export function paidAgent<TInput extends Record<string, unknown>>(
  opts: PaidAgentOptions,
  impl: (...args: unknown[]) => Promise<string>
): PaidAgentHandle<TInput> {
  return {
    async call(requester: AgentAddress, input: TInput): Promise<PaidAgentOutcome> {
      const taskHash = nextTaskHash();
      const spec: TaskSpec = {
        taskHash,
        description: `paid_agent invocation #${taskCounter}`,
        inputs: input
      };

      opts.chain.escrowLock({
        taskHash,
        requester,
        provider: opts.providerAddress,
        price: opts.price
      });
      opts.chain.hostageStake({
        taskHash,
        provider: opts.providerAddress,
        stake: opts.stake
      });

      const args = Object.values(input);
      const result = await impl(...args);
      const score = await opts.judge.evaluate(spec, result);

      if (score >= opts.qualityThreshold) {
        opts.chain.escrowRelease(taskHash);
        opts.chain.hostageRefund(taskHash);
        return { status: 'settled', result, score };
      } else {
        opts.chain.escrowRefund(taskHash);
        opts.chain.hostageSlash(taskHash, requester);
        return { status: 'slashed', result, score };
      }
    }
  };
}
```

- [ ] **Step 4: Export public API in `packages/sdk/src/index.ts`**

```ts
export { MockChain } from './mock-chain.js';
export { paidAgent, type PaidAgentOutcome, type PaidAgentHandle, type PaidAgentOptions } from './paid-agent.js';
export { QVACQualityVerifier, StubLLMJudge, type QualityJudge } from './quality.js';
export {
  scoreToScaled,
  scaledToScore,
  isValidPrice,
  SCORE_SCALE,
  type TaskId,
  type AgentAddress,
  type Price,
  type TaskSpec,
  type TaskCompletion,
  type PaidAgentConfig
} from './types.js';
export { AutonomousFiError } from './errors.js';

export const SDK_VERSION = '0.0.1';
```

- [ ] **Step 5: Run e2e test to confirm pass**

```bash
pnpm --filter @autonomousfi/sdk test
```
Expected: all 2 e2e cases pass, plus all earlier suites.

- [ ] **Step 6: Verify build still succeeds**

```bash
pnpm --filter @autonomousfi/sdk run build
pnpm --filter @autonomousfi/sdk run typecheck
```
Expected: no errors, dist re-emitted.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(sdk): paidAgent factory with mock escrow + hostage e2e"
```

- [ ] **Step 8: Invoke TypeScript reviewer subagent**

Dispatch `everything-claude-code:typescript-reviewer` against `packages/sdk/src/**` and address any blocking findings before moving to Task 6.

---

## Task 6: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  sdk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r run typecheck
      - run: pnpm -r run test
      - run: pnpm -r run build
```

- [ ] **Step 2: Create issue templates**

`.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug report
about: Report a defect
title: 'bug: '
labels: bug
---

## What happened?

## What did you expect?

## How to reproduce?

## Environment
- SDK version:
- Node version:
- OS:
```

`.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature request
about: Propose a new capability
title: 'feat: '
labels: enhancement
---

## Problem

## Proposed solution

## Alternatives considered
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "ci: github actions workflow + issue templates"
```

- [ ] **Step 4: Trigger CI by pushing**

Note: the actual push happens at the public-release checkpoint (Task 10). For now, the workflow file is staged but CI is dormant.

---

## Task 7: CrewAI plugin alpha

**Files:**
- Create: `packages/crewai-plugin/pyproject.toml`, `packages/crewai-plugin/README.md`, `packages/crewai-plugin/crewai_paidagent/__init__.py`, `packages/crewai-plugin/crewai_paidagent/plugin.py`, `packages/crewai-plugin/crewai_paidagent/bridge.py`, `packages/crewai-plugin/tests/test_plugin.py`
- Create: `demos/agent_to_agent_review.py`

For Sprint 1, the CrewAI plugin runs **fully inside Python** by spawning the TS SDK as a subprocess (`tsx`-driven IPC). This is intentionally simple; Sprint 2 replaces it with a long-lived HTTP service.

- [ ] **Step 1: Create `packages/crewai-plugin/pyproject.toml`**

```toml
[project]
name = "crewai-paidagent"
version = "0.0.1"
description = "CrewAI plugin for AutonomousFi @paid_agent"
license = { text = "Apache-2.0" }
requires-python = ">=3.11"
dependencies = [
  "crewai>=0.30,<1.0",
  "pydantic>=2.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "pytest-asyncio>=0.23"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

- [ ] **Step 2: Create `crewai_paidagent/__init__.py`**

```python
from .plugin import PaidCrewAgent

__all__ = ["PaidCrewAgent"]
```

- [ ] **Step 3: Create `crewai_paidagent/bridge.py`**

```python
"""Subprocess bridge to the TypeScript SDK MockChain.

Sprint 1 only, Sprint 2 replaces this with an HTTP service.
"""
from __future__ import annotations
import json
import subprocess
from dataclasses import dataclass
from typing import Any


@dataclass
class BridgeResult:
    status: str
    score: float
    result: str


def invoke_paid_agent(
    *,
    price: int,
    stake: int,
    quality_threshold: float,
    provider_address: str,
    requester_address: str,
    input_payload: dict[str, Any],
    result_text: str,
) -> BridgeResult:
    payload = {
        "price": str(price),
        "stake": str(stake),
        "qualityThreshold": quality_threshold,
        "providerAddress": provider_address,
        "requesterAddress": requester_address,
        "input": input_payload,
        "resultText": result_text,
    }
    cp = subprocess.run(
        ["pnpm", "--silent", "--filter", "@autonomousfi/sdk", "run", "ipc"],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        check=True,
    )
    out = json.loads(cp.stdout.strip().splitlines()[-1])
    return BridgeResult(status=out["status"], score=float(out["score"]), result=out["result"])
```

- [ ] **Step 4: Create the TS-side IPC entrypoint `packages/sdk/scripts/ipc.ts`**

```ts
import { MockChain, paidAgent, QVACQualityVerifier, StubLLMJudge } from '../src/index.js';
import type { AgentAddress, Price } from '../src/types.js';

interface IpcPayload {
  price: string;
  stake: string;
  qualityThreshold: number;
  providerAddress: string;
  requesterAddress: string;
  input: Record<string, unknown>;
  resultText: string;
}

async function main(): Promise<void> {
  const raw = await new Promise<string>((resolve) => {
    let buf = '';
    process.stdin.on('data', (c) => (buf += c));
    process.stdin.on('end', () => resolve(buf));
  });
  const payload = JSON.parse(raw) as IpcPayload;

  const chain = new MockChain();
  const provider = payload.providerAddress as AgentAddress;
  const requester = payload.requesterAddress as AgentAddress;
  chain.mintUsdt(requester, BigInt(payload.price) * 10n);
  chain.mintUsdt(provider, BigInt(payload.stake) * 10n);

  const judge = new QVACQualityVerifier(
    new StubLLMJudge({ matchScore: 0.9, failOn: 'BAD' })
  );

  const handle = paidAgent(
    {
      price: BigInt(payload.price) as Price,
      stake: BigInt(payload.stake) as Price,
      qualityThreshold: payload.qualityThreshold,
      deadlineMs: 60_000,
      providerAddress: provider,
      chain,
      judge
    },
    async () => payload.resultText
  );

  const out = await handle.call(requester, payload.input);
  process.stdout.write(JSON.stringify(out) + '\n');
}

main().catch((e) => {
  process.stderr.write(`ipc error: ${(e as Error).message}\n`);
  process.exit(1);
});
```

Add an `ipc` script to `packages/sdk/package.json`:

```json
{
  "scripts": {
    "ipc": "tsx scripts/ipc.ts"
  },
  "devDependencies": {
    "tsx": "^4.19.0"
  }
}
```

After editing the SDK `package.json` to add `tsx`, re-run `pnpm install` at the workspace root so the new devDep is fetched and the `ipc` script becomes invokable:

```bash
pnpm install
pnpm --filter @autonomousfi/sdk run typecheck
```
Expected: install resolves, typecheck still green.

- [ ] **Step 5: Create `crewai_paidagent/plugin.py`**

```python
"""PaidCrewAgent: wrap a CrewAI Agent so it bills counterparties through AutonomousFi.

Sprint 1 alpha: wraps the agent's `execute_task` to charge a fixed price and stake.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Any

try:
    from crewai import Agent  # type: ignore[import-not-found]
except ImportError:  # allow CI without crewai installed
    Agent = object  # type: ignore[assignment,misc]

from .bridge import invoke_paid_agent


@dataclass
class PaidCrewAgentConfig:
    price: int                  # USDT (mock units)
    stake: int                  # USDT (mock units)
    quality_threshold: float    # [0, 1]
    provider_address: str
    requester_address: str


class PaidCrewAgent:
    """Wrap a CrewAI Agent with on-settlement billing via AutonomousFi SDK."""

    def __init__(self, inner: Agent, config: PaidCrewAgentConfig) -> None:
        self._inner = inner
        self._config = config

    def execute_task(self, *, task_description: str, inputs: dict[str, Any] | None = None) -> dict[str, Any]:
        inputs = inputs or {}
        # delegate to inner CrewAI agent if available, else echo
        if hasattr(self._inner, "execute_task"):
            result_text = str(self._inner.execute_task(task=task_description))
        else:
            result_text = f"[stub] {task_description} -> {inputs}"

        bridge_result = invoke_paid_agent(
            price=self._config.price,
            stake=self._config.stake,
            quality_threshold=self._config.quality_threshold,
            provider_address=self._config.provider_address,
            requester_address=self._config.requester_address,
            input_payload=inputs,
            result_text=result_text,
        )
        return {
            "status": bridge_result.status,
            "score": bridge_result.score,
            "result": bridge_result.result,
        }
```

- [ ] **Step 6: Create `packages/crewai-plugin/tests/test_plugin.py`**

```python
from crewai_paidagent import PaidCrewAgent
from crewai_paidagent.plugin import PaidCrewAgentConfig


def test_paid_crew_agent_settles_on_acceptable_result(tmp_path, monkeypatch):
    cfg = PaidCrewAgentConfig(
        price=100,
        stake=50,
        quality_threshold=0.85,
        provider_address="0xBBBB",
        requester_address="0xAAAA",
    )
    agent = PaidCrewAgent(inner=None, config=cfg)
    out = agent.execute_task(task_description="review code", inputs={"snippet": "function ok(){}"})
    assert out["status"] in {"settled", "slashed"}
    assert isinstance(out["score"], float)


def test_paid_crew_agent_slashes_on_bad_marker(monkeypatch):
    cfg = PaidCrewAgentConfig(
        price=100,
        stake=50,
        quality_threshold=0.85,
        provider_address="0xBBBB",
        requester_address="0xAAAA",
    )
    agent = PaidCrewAgent(inner=None, config=cfg)
    # The stub judge in ipc.ts is wired to fail on "BAD"
    monkeypatch.setattr(agent, "_inner", type("E", (), {"execute_task": lambda self, task: "BAD output"})())
    out = agent.execute_task(task_description="review code")
    assert out["status"] == "slashed"
    assert out["score"] < 0.5
```

- [ ] **Step 7: Run Python tests**

```bash
cd packages/crewai-plugin
uv venv && uv pip install -e .[dev] tsx
pytest -v
```
Expected: both tests pass (subprocess bridges to TS SDK).

- [ ] **Step 8: Create the AUTON demo script `demos/agent_to_agent_review.py`**

```python
"""AUTON 2026-05-17 demo: agent A asks agent B for a code review and pays in mock USDT."""
from crewai_paidagent import PaidCrewAgent
from crewai_paidagent.plugin import PaidCrewAgentConfig

REVIEWER = PaidCrewAgentConfig(
    price=100,
    stake=50,
    quality_threshold=0.85,
    provider_address="0xBBBB",
    requester_address="0xAAAA",
)

class ReviewerInner:
    def execute_task(self, task: str) -> str:
        return f"Reviewed task `{task[:32]}`: no critical issues found."

if __name__ == "__main__":
    agent = PaidCrewAgent(inner=ReviewerInner(), config=REVIEWER)
    out = agent.execute_task(
        task_description="Review this code snippet: function add(a, b) { return a + b; }",
        inputs={"snippet": "function add(a, b) { return a + b; }"},
    )
    print(out)
    assert out["status"] == "settled", out
    print("\nSUCCESS: agent A paid agent B 100 USDT (mock) for the review.")
```

- [ ] **Step 9: Time the demo end-to-end**

```bash
time python demos/agent_to_agent_review.py
```
Expected: completes in < 30 seconds on a Mac M1+ and prints `SUCCESS:` line.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(crewai-plugin): alpha PaidCrewAgent wrapper + AUTON demo script"
```

---

## Task 8: AUTON 5/17 keynote deck

**Files:**
- Create: `presentations/auton-2026-05-17/slides.md`, `presentations/auton-2026-05-17/speaker-notes.md`, `presentations/auton-2026-05-17/demo-recording.md`

The deck is markdown so it can be rendered with Marp or any other tool; the talk audience is the AUTON kickoff (SMBC日興 / 東大IPC / Fracton / Next Finance Tech / 採択スタートアップ). Effort target: 12-18 slides, 25-30 minute talk, 5 minute live demo, 5 minute Q&A.

- [ ] **Step 1: Write keynote markdown `slides.md`**

Treat the outline below as **Step 1 (skeleton commit)** only. The full slide bullets, speaker-facing narrative for 25-30 minutes, are written in **Step 1a (full authoring)** as a follow-up sub-task. CEO writes the final narrative; Claude Code expands the skeleton into draft bullets first.

(Outline only here; the implementer writes full slide bullets, ~120 lines.)

```markdown
---
title: The Whuffie Problem in Practice
author: 渋谷 竜響 (Prime Beat 株式会社)
date: 2026-05-17
---

# Cover
- The Whuffie Problem in Practice
- 渋谷 竜響 / Prime Beat 株式会社

# 1. なぜこの登壇か
- AUTON Program 共同主催の所信表明
- AI エージェント経済が直面している core 問題を一つ晒し、構成的解を提示する

# 2. The Whuffie Problem (research preview)
- Cory Doctorow の Whuffie thought experiment
- cheap identity 下で reputation 経済は不可能 (Theorem 1, 直観だけ)

# 3. なぜ放置できないか
- AI agent 経済では agent 数が安価に生成可能
- 単純な reputation system は機能しない (insured agents / TFM の formal 系を引用)

# 4. 構成的解の概略 (Theorem 2)
- PoP × hostage hybrid mechanism
- 直観: 「人間性証明」+「ステーク没収可能性」が同時に立てば honest が dominant

# 5. AutonomousFi Agent の introduce
- これは論文だけではない実装
- Tether stack (QVAC + WDK + Plasma) + Risc0 zkVM + zkPassport

# 6. アーキテクチャ図 (4-layer)
- (spec §4.1 の図をそのまま貼り付け)

# 7. ライブデモ
- demos/agent_to_agent_review.py (in-memory mock)
- agent A → agent B が 30 秒以内に USDT 決済 + reputation 加算

# 8. (デモ後) なぜ AUTON で発表するのか
- 6 テーマ全てに Prime Beat の蓄積
- 採択者と 3 ヶ月共同で深掘りしたい

# 9. open call
- GitHub repo URL
- 5/24 までの Sprint 1 完了 → 採択者と dogfooding 開始
- Phase 2-4 ロードマップ概要 (spec §12)

# 10. 質疑応答
```

- [ ] **Step 2: Write `speaker-notes.md`**

15-20 分の talk script を日本語で。各 slide ごとに 100-200 字の note を付ける。録画後に共有する想定。

- [ ] **Step 3: Live-run the demo on the keynote laptop**

```bash
cd ~/Documents/dev/agentic-finance/autonomousfi
time python demos/agent_to_agent_review.py
```
Run 3 times back-to-back; record outputs in `demo-recording.md`. Confirm: each run < 30s, all `SUCCESS:` line printed.

- [ ] **Step 4: Commit deck**

```bash
git add presentations/
git commit -m "docs: AUTON 2026-05-17 keynote deck draft v1"
```

- [ ] **Step 5: 5/17 当日**

- 朝に demo を smoke test 一回
- 登壇 (録画 ON)
- 終了後 demo-recording.md に当日リンクと所感記入

- [ ] **Step 6: Post-keynote commit**

```bash
git add presentations/auton-2026-05-17/demo-recording.md
git commit -m "docs: AUTON 2026-05-17 keynote delivered, recording linked"
```

---

## Task 9: README polish + public repo readiness

**Files:**
- Modify: `README.md`
- Create: `docs/QUICKSTART.md`

- [ ] **Step 1: Update `README.md` to public-quality**

Replace existing README with content that includes: 1-paragraph hero, badges (CI, license, version stub), quick start (`pnpm install && pnpm test && python demos/agent_to_agent_review.py`), architecture diagram link, roadmap link, contributing link, AUTON keynote link, contact.

- [ ] **Step 2: Write `docs/QUICKSTART.md`**

Step-by-step for an external dev to clone, install, run tests, run the demo, and understand the next steps.

- [ ] **Step 3: Smoke test public quickstart on a clean clone**

```bash
cd /tmp
git clone <repo-url> /tmp/afi-smoke
cd /tmp/afi-smoke
pnpm install
pnpm test
cd packages/crewai-plugin && uv venv && uv pip install -e .[dev]
cd ../.. && python demos/agent_to_agent_review.py
```
Expected: everything passes for a fresh clone.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: public-quality README and quickstart guide"
```

---

## Task 10: GitHub public push

**Files:** (none, this is an operational task)

- [ ] **Step 1: Verify all Sprint 1 acceptance gates above**

Open this plan, mentally walk each gate. Any red gate? Decide: slip to Sprint 2 (annotate at bottom) or fix now.

- [ ] **Step 2: Create the GitHub repo via `gh` CLI**

```bash
gh repo create primebeat-inc/autonomousfi \
  --public \
  --description "Self-custodial USDT + zk reputation for AI agent marketplaces" \
  --homepage "https://github.com/primebeat-inc/autonomousfi" \
  --source . \
  --remote origin \
  --push
```

Expected: repo public on GitHub, master branch pushed, CI workflow runs.

- [ ] **Step 3: Verify CI passes**

```bash
gh run watch
```
Expected: SDK + crewai-plugin jobs green.

- [ ] **Step 4: Announce**

- Discord: ID `1485538350155694161` (社長 DM) に 1-line アナウンス + repo link (Vault MEMORY rule)
- X / Twitter: 1 thread 用ドラフトを `presentations/auton-2026-05-17/social-thread.md` に保存し、社長確認後に投稿

- [ ] **Step 5: Final commit closing Sprint 1**

```bash
git tag -a sprint-1-complete -m "Sprint 1 acceptance gates met"
git push origin sprint-1-complete
```

---

## Acceptance verification

Before declaring Sprint 1 complete, run the following all-green check:

```bash
pnpm -r run typecheck && pnpm -r run test && pnpm -r run build
cd packages/crewai-plugin && pytest -v && cd ../..
time python demos/agent_to_agent_review.py
gh run list --workflow=CI --branch=master --limit=1
git tag --list sprint-1-complete
```

All must succeed.

---

## Phase 1 outline (Sprint 2-6, future writing-plans invocations)

| Sprint | Window | Scope | Notes |
|---|---|---|---|
| 2 | 2026-05-26 → 06-07 | Solidity contracts v0 (`EscrowVault`, `HostageBond`, `ServiceMarketplace`) with Foundry fuzz + invariant; 80%+ coverage on testnet | First Solidity engagement; use Foundry default scaffolding |
| 3 | 2026-06-09 → 06-21 | Plasma testnet deploy script, viem-backed `USDTEscrow` and `HostageBond` clients replacing mock impl, e2e demo against testnet | Replaces `MockChain` consumer code path; mock stays for offline tests |
| 4 | 2026-06-23 → 07-05 | Risc0 reputation circuit v0 (guest + host), property tests, proving time bench (target <60s for N=100) | OQ-6 (LLM judge baseline) does NOT block this sprint |
| 5 | 2026-07-07 → 07-19 | zkPassport integration (alpha), `PoPVerifier.sol` on testnet, `ZkPoPProvider` client, e2e with PoP-gated discovery | Worldcoin fallback deferred to Phase 2 |
| 6 | 2026-07-21 → 07-31 | Phase 1 gate closure: 30+ GitHub stars push (Discord, X, HN), Tether grant wave applications drafted (#1-#5 from spec §11), Phase 2 plan via writing-plans | Grant application drafting is a CEO + Claude Code joint task |

Each subsequent sprint gets its own plan via `writing-plans`, scoped to ~10-15 days of work and bounded by a clear acceptance gate.

---

**Plan version:** v1 (2026-05-11). After plan-document-reviewer approval and user review, hand off to execution.
