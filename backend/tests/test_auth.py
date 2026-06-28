"""
Unit + Integration tests for authentication endpoints.
"""

def test_register_success(client):
    res = client.post("/auth/register", json={
        "full_name": "Alice Tan",
        "email": "alice@example.com",
        "password": "securepass123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "id" in data or "access_token" in data  # returns user or token
    assert data.get("email") == "alice@example.com" or "access_token" in data

def test_register_duplicate_email(client):
    payload = {"full_name": "Bob", "email": "bob@example.com", "password": "pass123"}
    client.post("/auth/register", json=payload)
    res = client.post("/auth/register", json=payload)
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()

def test_login_success(client):
    client.post("/auth/register", json={
        "full_name": "Carol", "email": "carol@example.com", "password": "mypassword"
    })
    res = client.post("/auth/login", json={
        "email": "carol@example.com", "password": "mypassword"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()

def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "full_name": "Dave", "email": "dave@example.com", "password": "correctpass"
    })
    res = client.post("/auth/login", json={
        "email": "dave@example.com", "password": "wrongpass"
    })
    assert res.status_code == 401

def test_login_nonexistent_user(client):
    res = client.post("/auth/login", json={
        "email": "nobody@example.com", "password": "anything"
    })
    assert res.status_code == 401

def test_get_me(client, auth_token):
    res = client.get(f"/auth/me?token={auth_token}")
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"

def test_get_me_invalid_token(client):
    res = client.get("/auth/me?token=invalidtoken123")
    assert res.status_code == 401
