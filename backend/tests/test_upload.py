"""
Tests for PDF/text upload extraction and confirm-upload endpoint.
Mocks the Claude API to avoid real API calls in CI.
"""
import pytest
from unittest.mock import patch, MagicMock
from app.routes.upload import extract_text_from_pdf
import io


# --- Unit tests: extract_text_from_pdf ---

def test_extract_text_from_pdf_returns_text():
    """extract_text_from_pdf should return non-empty string for a valid PDF."""
    import pdfplumber
    # Create a minimal in-memory PDF using pdfplumber's dependency (pypdf/pdfminer)
    # We mock pdfplumber.open instead to avoid needing real PDF bytes
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "CS2103T Assignment 1\nDue: 2026-09-01\n"
    mock_pdf = MagicMock()
    mock_pdf.__enter__ = MagicMock(return_value=mock_pdf)
    mock_pdf.__exit__ = MagicMock(return_value=False)
    mock_pdf.pages = [mock_page]

    with patch("pdfplumber.open", return_value=mock_pdf):
        result = extract_text_from_pdf(b"fake-pdf-bytes")

    assert "CS2103T" in result
    assert "Assignment 1" in result


def test_extract_text_from_pdf_empty_pages():
    """extract_text_from_pdf should return empty string if no text on pages."""
    mock_page = MagicMock()
    mock_page.extract_text.return_value = None
    mock_pdf = MagicMock()
    mock_pdf.__enter__ = MagicMock(return_value=mock_pdf)
    mock_pdf.__exit__ = MagicMock(return_value=False)
    mock_pdf.pages = [mock_page]

    with patch("pdfplumber.open", return_value=mock_pdf):
        result = extract_text_from_pdf(b"fake-pdf-bytes")

    assert result == ""


# --- Integration tests: /api/upload-text ---

MOCK_CLAUDE_RESPONSE = [
    {
        "title": "CS2103T Final Project",
        "due_date": "2026-11-30",
        "description": "Build a task manager app",
        "estimated_hours": 40,
        "course": "CS2103T",
        "milestones": [
            {"title": "Requirements", "due_date": "2026-10-01", "description": None, "estimated_hours": 5},
            {"title": "Implementation", "due_date": "2026-11-01", "description": None, "estimated_hours": 30},
        ]
    }
]


def _make_mock_message(content):
    import json
    mock_msg = MagicMock()
    mock_msg.content = [MagicMock(text=json.dumps(content))]
    return mock_msg


def test_upload_text_success(client, auth_token):
    with patch("app.routes.upload.call_claude_api", return_value=MOCK_CLAUDE_RESPONSE):
        res = client.post(
            f"/api/upload-text?token={auth_token}",
            json={"text": "CS2103T Assignment 1 due 2026-11-30. Build a task manager. " * 5}
        )
    assert res.status_code == 200
    data = res.json()
    assert "extracted" in data
    assert len(data["extracted"]) == 1
    assert data["extracted"][0]["title"] == "CS2103T Final Project"


def test_upload_text_too_short(client, auth_token):
    res = client.post(
        f"/api/upload-text?token={auth_token}",
        json={"text": "short"}
    )
    assert res.status_code == 400
    assert "too short" in res.json()["detail"].lower()


def test_upload_text_no_auth(client):
    res = client.post(
        "/api/upload-text?token=invalidtoken",
        json={"text": "some long text " * 10}
    )
    assert res.status_code == 401


# --- Integration tests: /api/confirm-upload ---

def test_confirm_upload_saves_assignments(client, auth_token):
    payload = {
        "token": auth_token,
        "filename": "test.pdf",
        "assignments": [
            {
                "title": "Essay",
                "due_date": "2026-12-01",
                "description": "Write an essay",
                "estimated_hours": 10,
                "course": "GEA1000",
                "milestones": [
                    {"title": "Outline", "due_date": "2026-11-01", "description": None, "estimated_hours": 2},
                    {"title": "Draft", "due_date": "2026-11-15", "description": None, "estimated_hours": 5},
                ]
            }
        ]
    }
    res = client.post("/api/confirm-upload", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["saved"] == ["Essay"]

    # Verify it appears in assignments list
    assignments_res = client.get(f"/api/assignments?token={auth_token}")
    titles = [a["title"] for a in assignments_res.json()]
    assert "Essay" in titles


def test_confirm_upload_invalid_date_skipped(client, auth_token):
    """Invalid due_date should be treated as null, not crash."""
    payload = {
        "token": auth_token,
        "filename": "test.pdf",
        "assignments": [
            {
                "title": "Bad Date Assignment",
                "due_date": "not-a-date",
                "description": None,
                "estimated_hours": 5,
                "course": None,
                "milestones": []
            }
        ]
    }
    res = client.post("/api/confirm-upload", json=payload)
    assert res.status_code == 200
    assert "Bad Date Assignment" in res.json()["saved"]


def test_confirm_upload_no_milestones(client, auth_token):
    payload = {
        "token": auth_token,
        "filename": "simple.pdf",
        "assignments": [
            {
                "title": "Simple Task",
                "due_date": None,
                "description": None,
                "estimated_hours": None,
                "course": None,
                "milestones": []
            }
        ]
    }
    res = client.post("/api/confirm-upload", json=payload)
    assert res.status_code == 200
    assert "Simple Task" in res.json()["saved"]
