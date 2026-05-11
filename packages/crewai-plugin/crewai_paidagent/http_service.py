"""HTTP service wrapping the AutonomousFi SDK.

Sprint 3 alpha: spawns once, accepts JSON over HTTP, returns settle/slash
outcome. Replaces the Sprint 1 subprocess bridge.
"""
from __future__ import annotations
import json
import subprocess
from contextlib import asynccontextmanager
from dataclasses import asdict
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .bridge import BridgeResult


class PaidAgentRequest(BaseModel):
    price: int = Field(gt=0)
    stake: int = Field(gt=0)
    quality_threshold: float = Field(ge=0.0, le=1.0)
    provider_address: str
    requester_address: str
    input_payload: dict[str, Any]
    result_text: str


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Warm up the tsx runtime once at startup so the first request is fast.
    # In Sprint 3 wave 2 this becomes a viem PublicClient + WalletClient pool.
    yield


app = FastAPI(title="autonomousfi-crewai-bridge", version="0.1.0", lifespan=lifespan)


@app.post("/v1/paid-agent")
async def invoke_paid_agent(req: PaidAgentRequest) -> dict[str, Any]:
    # Sprint 3 alpha: still delegates to the subprocess for the in-memory mock chain.
    # Sprint 3 wave 2 replaces this with direct viem calls against Plasma testnet.
    from .bridge import invoke_paid_agent as _bridge
    try:
        result: BridgeResult = _bridge(
            price=req.price,
            stake=req.stake,
            quality_threshold=req.quality_threshold,
            provider_address=req.provider_address,
            requester_address=req.requester_address,
            input_payload=req.input_payload,
            result_text=req.result_text,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    return asdict(result)


@app.get("/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}
