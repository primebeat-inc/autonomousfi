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
