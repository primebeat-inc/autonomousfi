from fastapi.testclient import TestClient
from crewai_paidagent.http_service import app


def test_health_endpoint():
    client = TestClient(app)
    r = client.get("/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_paid_agent_request_validation():
    client = TestClient(app)
    # Missing required fields
    r = client.post("/v1/paid-agent", json={})
    assert r.status_code == 422


def test_paid_agent_zero_price_rejected():
    client = TestClient(app)
    r = client.post("/v1/paid-agent", json={
        "price": 0,
        "stake": 50,
        "quality_threshold": 0.85,
        "provider_address": "0xBBBB",
        "requester_address": "0xAAAA",
        "input_payload": {},
        "result_text": "ok",
    })
    # Pydantic gt=0 constraint rejects price=0
    assert r.status_code == 422
