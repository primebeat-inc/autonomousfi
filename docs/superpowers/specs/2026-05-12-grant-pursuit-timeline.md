# Grant Pursuit Timeline (Honest, Dated)

**Date**: 2026-05-12
**Owner**: Prime Beat (渋谷)
**Context**: Retrospective gap fill for Phase 1 spec sec 11 ("$90K-160K from grants" without explicit application timing or probability adjustments).
**Purpose**: Replace the vague grant assumption with a dated, probability-adjusted pipeline and a documented shortfall plan for Phase 2 audits.

## Grants in pursuit, ranked by lead time

### Tether developer grants (next wave)

- Status as of 2026-05-12: previous wave deadlines 2026-03-24 and 2026-05-01 are both passed. The Tether grants page lists no current open task as of today; tasks open in batches.
- Realistic application: next wave likely 2026-06 or 2026-07. Apply with 6 module tasks (USDT escrow Solidity, viem client, browser extension, docs, QVAC SDK, CrewAI integration).
- Probability per task: 50 percent estimated. Cumulative across 6 tasks: 1 - 0.5^6 = 98 percent of landing at least one.
- Total expected value: 6 tasks * 0.5 success rate * $2.5K average = $7.5K. Not enough to cover Solidity audit alone.

### Tether co-development partnership

- Status: not yet approached. CEO has prior advisory relationship with Tether; this is an asks-for-asks negotiation, not a public grant.
- Realistic timeline: Phase 1 closure (2026-08), pitch in person at Tether developer events or via direct intro.
- Range: $10-50K, depending on whether Tether wants the SDK as official ecosystem reference.
- Probability: 30 percent. Conditional on AUTON keynote landing well, Tether ecosystem leads attending or seeing the recording.
- Expected: $9K.

### Ethereum Foundation Privacy and Scaling Explorations

- Status: PSE accepts proposals on a rolling basis but reviews in batches.
- Realistic timeline: proposal draft 2026-06, submission 2026-07, decision 2026-09 to 2026-10. Lead time 2-3 months from submission.
- Range: $30-50K for zk-PoP plus hostage hybrid mechanism research.
- Probability: 50 percent. The mechanism is well-defined and PSE has funded similar primitives.
- Expected: $20K.

### Optimism RetroPGF

- Status: retroactive only. Applies after Plasma testnet shipping (Sprint 3) and Optimism deploy (Phase 4, contingent on protocol fit).
- Realistic timeline: not before 2027 Q1.
- Probability: 30 percent.
- Expected: not counted toward Phase 2 audit budget.

### Base Builder Grants

- Status: requires Base deploy. Phase 4 candidate only.
- Not counted in Phase 2 budget.

## Cumulative budget projection for Phase 2 audits

Audit budget required (per Phase 1 spec sec 11):

- Solidity audit: $30-50K from Trail of Bits / Spearbit / OpenZeppelin
- zk circuit audit: $40-60K from Veridise / zkSecurity
- Subtotal: $70-110K

Grant expected value (probability adjusted, by Phase 2 start in 2026-08):

- Tether wave: $7.5K
- Tether co-dev: $9K (probability adjusted)
- EF PSE: $20K
- Subtotal: $36.5K

Shortfall: $33-73K. Required actions:

1. Reduce audit scope (Solidity only in Sprint 2, defer zk audit to Sprint 4)
2. Approach a fourth grant source (Aztec ecosystem? Polygon ZK?)
3. Use Prime Beat cash reserves if grant gap is over $30K at Phase 2 kickoff
4. Defer Phase 2 audit start to Sprint 5 if no funding by then

## Calendar of explicit milestones

- 2026-05-12: this doc written, AUTON keynote 5 days away
- 2026-05-17: AUTON keynote, brand exposure plus Tether attendee intros
- 2026-06-01: Tether next wave monitoring begins
- 2026-06-15: EF PSE proposal draft completion
- 2026-07-15: EF PSE proposal submission
- 2026-08-01: Sprint 2 kickoff (Solidity contracts production); grant pipeline review meeting
- 2026-10-01: EF PSE decision; Solidity audit firm engagement decision
- 2026-12-15: Phase 2 closure target

## Risk and fallback

If by 2026-09-30 grant pipeline yields less than $30K, the Phase 2 audit budget reverts to Prime Beat cash. Conservatively allocate $50K from year 1 cash reserves as the fallback; defer if cash flow projections trigger.
