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

## Project status (Phase 1)

This is an active research-driven build. Sprint 1 shipped 2026-05-12 with a mock chain and SDK foundation in place. See `ROADMAP.md` and the spec for the Phase 2-4 trajectory. Mainnet target is 2027 Q1, so expect interfaces to churn and the surface area to grow week over week.

If you are evaluating where to contribute, the highest-leverage areas right now are SDK ergonomics, the CrewAI plugin surface, and reproducible benchmarks. Speculative protocol changes need a written rationale before code lands.

## Local development

- Required: Node 22+, pnpm 9+, Python 3.11+, optionally `uv` for fast Python envs
- Setup: `pnpm install && pnpm -r run test` should pass 60 tests and build clean
- Coverage gate: 95% lines / 85% branches (enforced by the vitest config)
- Brand rule gate: no em dashes, no Web3/Web2 references in markdown outside `docs/superpowers/` (enforced by CI)

If a coverage gate or brand rule fails locally, fix it before opening a PR. CI runs the same checks, so a green local run is the fastest path through review.

## Branch model

- `main` is always release-ready. CI must be green and tests must pass before merge.
- Feature work lives on `feat/<topic>` or `fix/<topic>` branches.
- Sprint work uses `sprint-N` branches that merge into `main` via PR after review.

Avoid long-lived branches. If a feature is wider than a few days of work, split it into stacked PRs that each leave `main` shippable.

## Conventional commits

Commit prefixes signal intent to reviewers and to changelog tooling. Use them consistently.

- `feat(scope):` new feature
- `fix(scope):` bug fix
- `test(scope):` test-only changes
- `docs(scope):` documentation
- `chore(scope):` tooling, config, version bumps
- `refactor(scope):` no behavior change
- `ci:` CI workflow changes

Scopes used so far: `sdk`, `crewai-plugin`, `keynote`, `spec`, `plan`. New packages will introduce new scopes. When in doubt, match the scope to the top-level package or directory being touched.

## TDD discipline

Every behavioral change starts with a failing test. The cadence is: run and fail, implement, run and pass, then commit. The coverage gate enforces this empirically, so skipping the failing-test step tends to surface later as a CI rejection rather than a quiet pass.

Refactors that genuinely do not change behavior should leave tests untouched while improving structure. If a refactor needs new tests, treat it as a feature and gate it accordingly.

## Where to ask

- Issues for bugs and feature requests
- Discussions tab (when enabled) for design questions
- Direct: X @shibutatsu

For security-sensitive reports, do not open a public issue. Reach out directly and we will coordinate disclosure.

## Code of conduct

Be respectful. We follow the Contributor Covenant v2.1.
