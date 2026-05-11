"""Demonstrates the failure / slash path: provider crashes, escrow refunds requester, hostage slashed."""
from crewai_paidagent import PaidCrewAgent
from crewai_paidagent.plugin import PaidCrewAgentConfig

# This config sets a high quality threshold (0.85). The stub LLM judge inside
# the SDK's ipc.ts is wired to detect the substring "BAD" and return 0.1
# (below threshold), forcing the slash path.

REVIEWER = PaidCrewAgentConfig(
    price=100,
    stake=50,
    quality_threshold=0.85,
    provider_address="0xBBBB",
    requester_address="0xAAAA",
)

class CrashingReviewer:
    def execute_task(self, task: str) -> str:
        # Returning the substring "BAD" forces the StubLLMJudge to fail
        return "BAD output: provider produced incorrect review"

if __name__ == "__main__":
    agent = PaidCrewAgent(inner=CrashingReviewer(), config=REVIEWER)
    out = agent.execute_task(
        task_description="Review this code snippet (will fail intentionally)",
        inputs={"snippet": "function add(a, b) { return a - b; }"},  # subtle bug
    )
    print(out)
    assert out["status"] == "slashed", out
    print("\nSUCCESS (failure path): provider's hostage was slashed; agent A got refund + stake.")
