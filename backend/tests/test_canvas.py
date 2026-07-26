"""
Integration tests for Canvas LMS sync logic (#17).
Tests duplicate detection, storage, and HTML stripping using mocked Canvas API.
"""
from unittest.mock import patch, AsyncMock, MagicMock
from app.routes.canvas import strip_html


# --- Unit tests for strip_html (Canvas description cleaning) ---

def test_strip_html_removes_tags():
    assert strip_html("<p>Hello <strong>world</strong></p>") == "Hello world"

def test_strip_html_handles_none():
    assert strip_html(None) is None

def test_strip_html_handles_empty():
    assert strip_html("") is None

def test_strip_html_decodes_entities():
    assert strip_html("A &amp; B &lt;C&gt;") == "A & B <C>"


# --- Integration tests for Canvas sync endpoint ---

MOCK_COURSES = [
    {"id": 101, "name": "Software Engineering", "course_code": "CS2103T", "enrollment_state": "active"}
]

MOCK_ASSIGNMENTS = [
    {
        "id": 9001,
        "name": "Team Project v1.0",
        "description": "<p>Build a task manager app with your team.</p>",
        "due_at": "2026-08-01T15:59:00Z",
    },
    {
        "id": 9002,
        "name": "No Due Date Assignment",
        "description": "<p>Optional reading</p>",
        "due_at": None,  # Should be skipped
    }
]

def make_mock_response(json_data, status_code=200):
    mock = MagicMock()
    mock.status_code = status_code
    mock.json.return_value = json_data
    return mock

def test_canvas_sync_saves_new_assignment(client, auth_headers):
    """Canvas sync should save assignments with due dates."""
    # Save a fake canvas token first
    client.post("/api/canvas/token?canvas_token=faketoken123", headers=auth_headers)

    with patch("app.routes.canvas.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        mock_client.get = AsyncMock(side_effect=[
            make_mock_response(MOCK_COURSES),       # courses call
            make_mock_response(MOCK_ASSIGNMENTS),   # assignments call
        ])

        res = client.post("/api/canvas/sync", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["message"] == "Synced 1 new assignments from Canvas"

def test_canvas_sync_skips_no_due_date(client, auth_headers):
    """Assignments without due dates should not be saved."""
    client.post("/api/canvas/token?canvas_token=faketoken123", headers=auth_headers)

    with patch("app.routes.canvas.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        mock_client.get = AsyncMock(side_effect=[
            make_mock_response(MOCK_COURSES),
            make_mock_response(MOCK_ASSIGNMENTS),
        ])
        client.post("/api/canvas/sync", headers=auth_headers)

    # Only 1 of 2 assignments has a due date
    assignments = client.get("/api/assignments", headers=auth_headers).json()
    canvas_assignments = [a for a in assignments if a["source"] == "canvas"]
    assert all(a["due_date"] is not None for a in canvas_assignments)

def test_canvas_sync_no_duplicates(client, auth_headers):
    """Syncing the same Canvas assignments twice should not create duplicates."""
    client.post("/api/canvas/token?canvas_token=faketoken123", headers=auth_headers)

    def make_side_effect():
        return [
            make_mock_response(MOCK_COURSES),
            make_mock_response(MOCK_ASSIGNMENTS),
        ]

    with patch("app.routes.canvas.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        mock_client.get = AsyncMock(side_effect=make_side_effect())
        client.post("/api/canvas/sync", headers=auth_headers)

    with patch("app.routes.canvas.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        mock_client.get = AsyncMock(side_effect=make_side_effect())
        res2 = client.post("/api/canvas/sync", headers=auth_headers)

    assert res2.json()["message"] == "Synced 0 new assignments from Canvas"

def test_canvas_sync_strips_html_from_description(client, auth_headers):
    """Canvas descriptions should have HTML stripped before saving."""
    client.post("/api/canvas/token?canvas_token=faketoken123", headers=auth_headers)

    html_assignment = [{
        "id": 9999,
        "name": "HTML Test Assignment",
        "description": "<div><p>This is <strong>important</strong>.</p></div>",
        "due_at": "2026-09-01T15:59:00Z",
    }]

    with patch("app.routes.canvas.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        mock_client.get = AsyncMock(side_effect=[
            make_mock_response(MOCK_COURSES),
            make_mock_response(html_assignment),
        ])
        client.post("/api/canvas/sync", headers=auth_headers)

    assignments = client.get("/api/assignments", headers=auth_headers).json()
    html_test = next((a for a in assignments if a["title"] == "HTML Test Assignment"), None)
    assert html_test is not None
    assert "<" not in (html_test["description"] or "")

def test_canvas_sync_requires_token(client, auth_headers):
    """Sync should fail if no Canvas token is saved."""
    # Use a fresh user with no canvas token
    client.post("/auth/register", json={
        "full_name": "No Token User",
        "email": "notoken@example.com",
        "password": "password123"
    })
    login = client.post("/auth/login", json={
        "email": "notoken@example.com", "password": "password123"
    })
    fresh_token = login.json()["access_token"]
    fresh_headers = {"Authorization": f"Bearer {fresh_token}"}

    res = client.post("/api/canvas/sync", headers=fresh_headers)
    assert res.status_code == 400
