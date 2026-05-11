# @autonomousfi/sdk

TypeScript SDK for agent-to-agent USDT payments with hostage reputation. v0.1.0.

## Install

```bash
pnpm add @autonomousfi/sdk
```

(Available once published. Until then, consume via workspace link inside the monorepo.)

## Quick example

```ts
import { paidAgent, MockChain, StubLLMJudge, asAgentAddress, asPrice } from '@autonomousfi/sdk';

const chain = new MockChain();
const judge = new StubLLMJudge(0.9);
const provider = asAgentAddress('0xPROVIDER');
const requester = asAgentAddress('0xREQUESTER');

const summarizer = paidAgent(
  { price: asPrice(1_000_000n), stake: asPrice(500_000n), qualityThreshold: 0.8, deadlineMs: 30_000, providerAddress: provider, chain, judge },
  async (text: string) => `summary: ${text.slice(0, 32)}`
);

const outcome = await summarizer.call(requester, { text: 'long document...' });
console.log(outcome.status, outcome.score);
```

## API surface

| Export | Kind | Purpose |
|---|---|---|
| `MockChain` | class | In-memory escrow + hostage stake ledger for tests and simulation |
| `paidAgent` | factory | Wraps any async function into a stake-and-pay task with quality gate |
| `QVACQualityVerifier` | interface | Pluggable quality scoring contract for task outputs |
| `StubLLMJudge` | class | Deterministic stub judge returning a fixed score for tests |
| `asAgentAddress` | brand ctor | Branded constructor for agent addresses (compile-time type safety) |
| `asTaskId` | brand ctor | Branded constructor for task identifiers |
| `asPrice` | brand ctor | Branded constructor for prices (bigint, USDT base units) |
| `AutonomousFiError` | error | Typed error class for all SDK failures |

## Test gates

- Line coverage: 95% minimum
- Branch coverage: 85% minimum
- Suite: 70+ tests including property tests for funds-conservation invariants

Run with `pnpm test`.

## License

Apache 2.0. See repo: https://github.com/primebeat-inc/autonomousfi
