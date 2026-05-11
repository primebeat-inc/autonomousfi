import subprocess
from unittest.mock import patch

import pytest

from crewai_paidagent import PaidCrewAgent
from crewai_paidagent.bridge import invoke_paid_agent
from crewai_paidagent.plugin import PaidCrewAgentConfig


_BRIDGE_KWARGS = dict(
    price=100,
    stake=50,
    quality_threshold=0.85,
    provider_address="0xBBBB",
    requester_address="0xAAAA",
    input_payload={"snippet": "function ok(){}"},
    result_text="ok",
)


def _completed(stdout: str, stderr: str = "") -> subprocess.CompletedProcess:
    return subprocess.CompletedProcess(
        args=["pnpm", "ipc"], returncode=0, stdout=stdout, stderr=stderr
    )


def test_bridge_raises_on_timeout():
    with patch(
        "crewai_paidagent.bridge.subprocess.run",
        side_effect=subprocess.TimeoutExpired(cmd=["pnpm", "ipc"], timeout=30),
    ):
        with pytest.raises(RuntimeError, match=r"timed out after 30s"):
            invoke_paid_agent(**_BRIDGE_KWARGS)


def test_bridge_raises_on_non_json_stdout():
    with patch(
        "crewai_paidagent.bridge.subprocess.run",
        return_value=_completed("not-json garbage\n"),
    ):
        with pytest.raises(RuntimeError, match=r"non-JSON tail line"):
            invoke_paid_agent(**_BRIDGE_KWARGS)


def test_bridge_raises_on_empty_stdout():
    with patch(
        "crewai_paidagent.bridge.subprocess.run",
        return_value=_completed(""),
    ):
        with pytest.raises(RuntimeError, match=r"produced no stdout"):
            invoke_paid_agent(**_BRIDGE_KWARGS)


def test_bridge_filters_blank_lines_and_takes_last_json():
    stdout = '\n\n{"status":"settled","score":0.9,"result":"ok"}\n'
    with patch(
        "crewai_paidagent.bridge.subprocess.run",
        return_value=_completed(stdout),
    ):
        result = invoke_paid_agent(**_BRIDGE_KWARGS)
    assert result.status == "settled"
    assert result.score == 0.9
    assert result.result == "ok"


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
