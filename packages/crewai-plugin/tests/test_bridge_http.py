import os
from unittest.mock import patch, MagicMock
from crewai_paidagent.bridge import invoke_paid_agent


def test_subprocess_path_when_env_unset(monkeypatch):
    monkeypatch.delenv("AUTONOMOUSFI_HTTP_URL", raising=False)
    # Just verify the function picks the subprocess code path
    with patch("crewai_paidagent.bridge._invoke_via_subprocess") as m:
        m.return_value = MagicMock()
        invoke_paid_agent(
            price=100,
            stake=50,
            quality_threshold=0.85,
            provider_address="0xB",
            requester_address="0xA",
            input_payload={},
            result_text="ok",
        )
        m.assert_called_once()


def test_http_path_when_env_set(monkeypatch):
    monkeypatch.setenv("AUTONOMOUSFI_HTTP_URL", "http://localhost:8000")
    with patch("crewai_paidagent.bridge._invoke_via_http") as m:
        m.return_value = MagicMock()
        invoke_paid_agent(
            price=100,
            stake=50,
            quality_threshold=0.85,
            provider_address="0xB",
            requester_address="0xA",
            input_payload={},
            result_text="ok",
        )
        m.assert_called_once()
