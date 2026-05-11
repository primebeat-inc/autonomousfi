# crewai-paidagent

CrewAI plugin for AutonomousFi `@paid_agent`. Wraps a CrewAI `Agent` so it bills counterparties through the AutonomousFi SDK on every settlement.

## Sprint 1 status

Alpha. The plugin runs entirely in Python and spawns the TypeScript SDK as a subprocess (`pnpm --filter @autonomousfi/sdk run ipc`) over stdin/stdout JSON. Sprint 2 replaces this with a long-lived HTTP service.

## Install

```bash
cd packages/crewai-plugin
uv venv && uv pip install -e .[dev]
```

If `crewai` cannot be installed (heavy LangChain tree), the plugin still works. It falls back to an `Agent = object` stub. Real CrewAI integration becomes mandatory only in Sprint 2.

## Usage

```python
from crewai_paidagent import PaidCrewAgent
from crewai_paidagent.plugin import PaidCrewAgentConfig

cfg = PaidCrewAgentConfig(
    price=100,
    stake=50,
    quality_threshold=0.85,
    provider_address="0xBBBB",
    requester_address="0xAAAA",
)
agent = PaidCrewAgent(inner=my_crewai_agent, config=cfg)
out = agent.execute_task(task_description="review code", inputs={"snippet": "..."})
# {"status": "settled" | "slashed", "score": float, "result": str}
```

## Demo

See `demos/agent_to_agent_review.py` at the repo root for the AUTON 2026-05-17 keynote walkthrough.
