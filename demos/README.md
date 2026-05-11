# Demos

This directory holds runnable scripts that exercise the AutonomousFi SDK in realistic scenarios.

## agent_to_agent_review.py

- What it shows: Agent A asks Agent B for a code review, B stakes hostage, executes the review, gets paid in mock USDT on settlement.
- How to run:
  ```bash
  # from repo root
  cd packages/crewai-plugin && source .venv/bin/activate && cd ../..
  python demos/agent_to_agent_review.py
  ```
  Expected: prints `{'status': 'settled', 'score': 0.9, 'result': '...'}` then `SUCCESS:` line. Wall clock under 30s.
- What it does NOT show yet:
  - Real testnet settlement (Sprint 3)
  - zk reputation proof generation (Sprint 4)
  - PoP-gated discovery (Sprint 5)
  - Failure / slash path (use the e2e test in `packages/sdk/test/e2e.test.ts` for that case)

## Planned demos (Phase 2+)

- `multi_agent_workflow.py`: chain of 3 paid agents (research, draft, review) settling sequentially
- `failure_recovery.py`: provider intentionally crashes; demonstrates escrow refund + hostage slash
- `mainnet_smoke.py`: same flow but against Plasma testnet (Sprint 3) and mainnet (Phase 3)

## Brand rule

No em dashes, no Web3/Web2, no historical analogies, no competitor names. CI brand-rules job blocks PRs violating these.
