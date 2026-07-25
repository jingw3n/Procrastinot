"""
Tests for dashboard workload counts and overdue status recalculation.
"""
from datetime import datetime, timezone, timedelta


def _create_assignment(client, auth_token, title, due_date=None, status=None):
    payload = {"title": title, "source": "manual"}
    if due_date:
        payload["due_date"] = due_date
    if status:
        payload["status"] = status
    return client.post(f"/api/assignments?token={auth_token}", json=payload).json()


# --- Dashboard workload counts ---

def test_dashboard_empty(client, auth_token):
    res = client.get(f"/api/dashboard?token={auth_token}")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0
    assert data["upcoming"] == 0
    assert data["overdue"] == 0


def test_dashboard_counts_upcoming(client, auth_token):
    _create_assignment(client, auth_token, "Upcoming 1")
    _create_assignment(client, auth_token, "Upcoming 2")
    res = client.get(f"/api/dashboard?token={auth_token}")
    data = res.json()
    assert data["upcoming"] >= 2
    assert data["total"] >= 2


def test_dashboard_counts_completed_not_overdue(client, auth_token):
    a = _create_assignment(client, auth_token, "Done Task")
    client.put(f"/api/assignments/{a['id']}?token={auth_token}", json={"status": "completed"})
    res = client.get(f"/api/dashboard?token={auth_token}")
    data = res.json()
    assert data["overdue"] == 0


def test_dashboard_invalid_token():
    from fastapi.testclient import TestClient
    from main import app
    c = TestClient(app)
    res = c.get("/api/dashboard?token=badtoken")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0


# --- Overdue status recalculation (task #24 fix) ---

def test_status_becomes_overdue_when_due_date_set_to_past(client, auth_token):
    a = _create_assignment(client, auth_token, "Late Assignment")
    assert a["status"] == "upcoming"

    past_date = (datetime.now(timezone.utc) - timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    res = client.put(f"/api/assignments/{a['id']}?token={auth_token}", json={
        "due_date": past_date
    })
    assert res.status_code == 200
    assert res.json()["status"] == "overdue"


def test_status_becomes_upcoming_when_due_date_set_to_future(client, auth_token):
    a = _create_assignment(client, auth_token, "Future Assignment")
    # First make it overdue
    past_date = (datetime.now(timezone.utc) - timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    client.put(f"/api/assignments/{a['id']}?token={auth_token}", json={"due_date": past_date})

    # Now set to future
    future_date = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%SZ")
    res = client.put(f"/api/assignments/{a['id']}?token={auth_token}", json={
        "due_date": future_date
    })
    assert res.status_code == 200
    assert res.json()["status"] == "upcoming"


def test_completed_status_not_overridden_by_due_date_change(client, auth_token):
    a = _create_assignment(client, auth_token, "Completed Assignment")
    client.put(f"/api/assignments/{a['id']}?token={auth_token}", json={"status": "completed"})

    past_date = (datetime.now(timezone.utc) - timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    res = client.put(f"/api/assignments/{a['id']}?token={auth_token}", json={
        "due_date": past_date
    })
    assert res.status_code == 200
    assert res.json()["status"] == "completed"


def test_explicit_status_update_takes_priority(client, auth_token):
    """If status is explicitly set in the same request as due_date, honour it."""
    a = _create_assignment(client, auth_token, "Manual Status")
    past_date = (datetime.now(timezone.utc) - timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    res = client.put(f"/api/assignments/{a['id']}?token={auth_token}", json={
        "due_date": past_date,
        "status": "completed"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "completed"
