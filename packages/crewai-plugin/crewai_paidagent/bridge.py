"""Subprocess bridge to the TypeScript SDK MockChain.

Sprint 1 only — Sprint 2 replaces this with an HTTP service.
"""
from __future__ import annotations
import json
import os
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class BridgeResult:
    status: str
    score: float
    result: str


def _find_repo_root() -> Path:
    """Walk up from this file until we find pnpm-workspace.yaml."""
    here = Path(__file__).resolve()
    for parent in (here, *here.parents):
        if (parent / "pnpm-workspace.yaml").is_file():
            return parent
    # Fall back to assuming packages/crewai-plugin/crewai_paidagent → up 3
    return here.parents[3]


def invoke_paid_agent(
    *,
    price: int,
    stake: int,
    quality_threshold: float,
    provider_address: str,
    requester_address: str,
    input_payload: dict[str, Any],
    result_text: str,
) -> BridgeResult:
    payload = {
        "price": str(price),
        "stake": str(stake),
        "qualityThreshold": quality_threshold,
        "providerAddress": provider_address,
        "requesterAddress": requester_address,
        "input": input_payload,
        "resultText": result_text,
    }
    cwd = os.environ.get("AUTONOMOUSFI_REPO_ROOT") or str(_find_repo_root())
    try:
        cp = subprocess.run(
            ["pnpm", "--silent", "--filter", "@autonomousfi/sdk", "run", "ipc"],
            input=json.dumps(payload),
            text=True,
            capture_output=True,
            check=True,
            cwd=cwd,
            timeout=30,
        )
    except subprocess.TimeoutExpired as e:
        raise RuntimeError(
            f"ipc subprocess timed out after 30s. cwd={cwd!r}. partial stdout: {e.stdout!r}, stderr: {e.stderr!r}"
        ) from e
    # The TS IPC writes a single JSON line to stdout. Take the last non-empty line
    # to be defensive against any pnpm/tsx prelude that slipped past --silent.
    lines = [ln for ln in cp.stdout.strip().splitlines() if ln.strip()]
    if not lines:
        raise RuntimeError(
            f"ipc subprocess produced no stdout. stderr: {cp.stderr!r}"
        )
    try:
        out = json.loads(lines[-1])
    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"ipc subprocess produced non-JSON tail line: {lines[-1]!r}. full stdout: {cp.stdout!r}, stderr: {cp.stderr!r}"
        ) from e
    return BridgeResult(status=out["status"], score=float(out["score"]), result=out["result"])
