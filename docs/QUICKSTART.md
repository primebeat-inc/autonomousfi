# Quickstart

This guide walks you from a fresh clone to a working agent-to-agent paid demo in under five minutes. If anything below fails on your machine, please open a [GitHub issue](https://github.com/prime-beat/autonomousfi/issues/new) with the command and the full error.

## 1. Clone the repository

```bash
git clone https://github.com/prime-beat/autonomousfi.git
cd autonomousfi
```

## 2. Install the toolchain

You need:

- **Node.js 22 or newer** ([install from nodejs.org](https://nodejs.org/), or use `nvm install 22 && nvm use 22`). The repo's `.nvmrc` pins the expected version.
- **pnpm 9 or newer** ([install from pnpm.io](https://pnpm.io/installation), or `npm install -g pnpm@9`).
- **Python 3.10 or newer** (only required for the CrewAI plugin demo). [`uv`](https://docs.astral.sh/uv/) is recommended but not required.

Verify:

```bash
node --version    # v22.x or newer
pnpm --version    # 9.x or newer
python --version  # 3.10 or newer
```

## 3. Install workspace dependencies

From the repo root:

```bash
pnpm install
```

This installs the TypeScript SDK plus its dev dependencies (`vitest`, `typescript`, `tsx`, `fast-check`). It runs in well under a minute on a normal connection.

## 4. Run the SDK test suite

```bash
pnpm test
```

You should see **17 / 17 tests pass** across the SDK package (`packages/sdk`). Coverage is roughly 97 % statements, 76 % branches, 95 % functions, 97 % lines. If even one test fails on `main`, that is a bug, please file an issue.

A focused run:

```bash
pnpm --filter @autonomousfi/sdk test
```

## 5. Run the agent-to-agent paid demo

The demo shows agent A asking agent B for a code review and paying 100 mock USDT through the SDK's hostage-escrow flow.

### Option A: with `uv` (recommended)

```bash
cd packages/crewai-plugin
uv venv
uv pip install -e '.[dev]'    # quote the extras spec so zsh does not glob it
source .venv/bin/activate     # on Windows: .venv\Scripts\activate
cd ../..
python demos/agent_to_agent_review.py
```

### Option B: with built-in `venv` and `pip`

```bash
cd packages/crewai-plugin
python -m venv .venv
source .venv/bin/activate          # on Windows: .venv\Scripts\activate
pip install -e '.[dev]'
cd ../..
python demos/agent_to_agent_review.py
```

Expected output (last line):

```
SUCCESS: agent A paid agent B 100 USDT (mock) for the review.
```

The plugin runs entirely in Python and spawns the TypeScript SDK as a short-lived subprocess over JSON IPC. Real CrewAI is not required for the demo to pass; if `crewai` cannot be installed because of its heavy dependency tree, the plugin falls back to a stub. Full CrewAI integration becomes mandatory in Sprint 2.

## 6. What to read next

- **Design spec** (section 4 has the architecture diagram): [`docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md`](./superpowers/specs/2026-05-11-autonomous-fi-agent-design.md)
- **Roadmap**: [`docs/ROADMAP.md`](./ROADMAP.md)
- **Contributing guide**: [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
- **SDK source**: [`packages/sdk/src`](../packages/sdk/src)
- **AUTON 2026-05-17 keynote deck**: [`presentations/auton-2026-05-17/`](../presentations/auton-2026-05-17/)

## Troubleshooting

| Symptom | Fix |
|---|---|
| `zsh: no matches found: .[dev]` | Quote the extras: `uv pip install -e '.[dev]'`. zsh treats `[...]` as a glob. |
| `pnpm: command not found` | `npm install -g pnpm@9` or use `corepack enable && corepack prepare pnpm@9 --activate`. |
| `Error: Cannot find module 'tsx'` when running the demo | Run `pnpm install` at the repo root; the demo spawns `pnpm --filter @autonomousfi/sdk run ipc`. |
| `crewai` install fails with a LangChain compile error | Skip it. The plugin falls back to a stub. The demo still runs. |
| Python version mismatch | Use `python3.11` (or any 3.10+) explicitly, or [pyenv](https://github.com/pyenv/pyenv) to manage versions. |
| Node version is below 22 | `nvm install 22 && nvm use 22`, then re-run `pnpm install`. |

If you hit something not on this list, file an issue, the maintainers triage every ticket during Phase 1.
