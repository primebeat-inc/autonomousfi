"""PaidCrewAgent — wrap a CrewAI Agent so it bills counterparties through AutonomousFi.

Sprint 1 alpha: wraps the agent's `execute_task` to charge a fixed price and stake.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Any

try:
    from crewai import Agent  # type: ignore[import-not-found]
except ImportError:  # allow CI without crewai installed
    Agent = object  # type: ignore[assignment,misc]

from .bridge import invoke_paid_agent


@dataclass
class PaidCrewAgentConfig:
    price: int                  # USDT (mock units)
    stake: int                  # USDT (mock units)
    quality_threshold: float    # [0, 1]
    provider_address: str
    requester_address: str


class PaidCrewAgent:
    """Wrap a CrewAI Agent with on-settlement billing via AutonomousFi SDK."""

    def __init__(self, inner: Agent, config: PaidCrewAgentConfig) -> None:
        self._inner = inner
        self._config = config

    def execute_task(self, *, task_description: str, inputs: dict[str, Any] | None = None) -> dict[str, Any]:
        inputs = inputs or {}
        # delegate to inner CrewAI agent if available, else echo
        if hasattr(self._inner, "execute_task"):
            result_text = str(self._inner.execute_task(task=task_description))
        else:
            result_text = f"[stub] {task_description} -> {inputs}"

        bridge_result = invoke_paid_agent(
            price=self._config.price,
            stake=self._config.stake,
            quality_threshold=self._config.quality_threshold,
            provider_address=self._config.provider_address,
            requester_address=self._config.requester_address,
            input_payload=inputs,
            result_text=result_text,
        )
        return {
            "status": bridge_result.status,
            "score": bridge_result.score,
            "result": bridge_result.result,
        }
