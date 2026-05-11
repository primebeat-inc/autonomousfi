# Sprint 1 Retrospective

## What we shipped
- SDK with 70 passing tests
- CrewAI plugin alpha
- AUTON keynote deck
- Public GitHub push
- CI brand-rule gate

## What worked
- Subagent parallel dispatch for independent tracks
- TDD discipline kept regressions out of the SDK
- Automated brand-rule grep caught terminology drift before review

## What did not work
- Subprocess bridge cold start was slower than expected and skewed early benchmarks
- Mock-only chain limited realism of integration scenarios
- Em dash leaks slipped into early commits before the CI gate was active
- 10-parallel push race conditions, resolved by adopting a pull-rebase pattern

## What we changed mid-sprint
- Moved taskCounter into closure scope to stop cross-test bleed
- Extracted STUB_FAILURE_SCORE as a named constant
- Added try/catch around escrow path to fix the leak on failure
- Renamed the error code for the hostage path for clarity

## Carry forward to Sprint 2
- Replace Object.values positional spread with explicit field access
- Add deadline timeout on long-running operations
- Close the audit funding gap before public release
- Solidity contracts remain pending and need to land
