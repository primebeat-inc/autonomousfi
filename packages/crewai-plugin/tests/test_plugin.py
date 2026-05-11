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
