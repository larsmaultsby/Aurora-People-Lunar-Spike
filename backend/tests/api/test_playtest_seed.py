from fastapi.testclient import TestClient


def test_playtest_seed_is_dev_only_and_idempotent(tmp_path, monkeypatch):
    monkeypatch.setenv("SCENARIO_DB_PATH", str(tmp_path / "scenarios.db"))
    monkeypatch.setenv("EVENT_DB_PATH", str(tmp_path / "events.db"))
    monkeypatch.delenv("LUNAR_SEED_PLAYTEST", raising=False)

    from app.main import app
    client = TestClient(app)

    first = client.get("/api/scenarios/")
    assert first.status_code == 200
    assert not any(s["title"] == "Aurora World: Open Sandbox" for s in first.json())

    monkeypatch.setenv("LUNAR_SEED_PLAYTEST", "1")
    seeded = client.get("/api/scenarios/")
    assert seeded.status_code == 200
    matches = [s for s in seeded.json() if s["title"] == "Aurora World: Open Sandbox"]
    assert len(matches) == 1
    assert matches[0]["opening_mode"] == "ai"
    assert len(matches[0]["setup_questions"]) == 4

    again = client.get("/api/scenarios/")
    matches = [s for s in again.json() if s["title"] == "Aurora World: Open Sandbox"]
    assert len(matches) == 1
