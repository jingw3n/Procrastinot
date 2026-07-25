"""
Integration tests for assignment CRUD, soft delete, trash, and restore.
"""

def test_get_assignments_empty(client, auth_token):
    res = client.get(f"/api/assignments?token={auth_token}")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_create_assignment(client, auth_token):
    res = client.post(f"/api/assignments?token={auth_token}", json={
        "title": "CS2103T Final Project",
        "description": "Build a task manager",
        "estimated_hours": 20,
        "source": "manual"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "CS2103T Final Project"
    assert data["status"] == "upcoming"
    return data["id"]

def test_get_assignments_returns_created(client, auth_token):
    client.post(f"/api/assignments?token={auth_token}", json={
        "title": "Test Assignment", "source": "manual"
    })
    res = client.get(f"/api/assignments?token={auth_token}")
    assert res.status_code == 200
    titles = [a["title"] for a in res.json()]
    assert "Test Assignment" in titles

def test_update_assignment(client, auth_token):
    create_res = client.post(f"/api/assignments?token={auth_token}", json={
        "title": "Old Title", "source": "manual"
    })
    assignment_id = create_res.json()["id"]

    update_res = client.put(f"/api/assignments/{assignment_id}?token={auth_token}", json={
        "title": "New Title",
        "course": "CS2103T",
        "status": "completed"
    })
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["title"] == "New Title"
    assert data["status"] == "completed"

def test_soft_delete_assignment(client, auth_token):
    create_res = client.post(f"/api/assignments?token={auth_token}", json={
        "title": "To Be Deleted", "source": "manual"
    })
    assignment_id = create_res.json()["id"]

    del_res = client.delete(f"/api/assignments/{assignment_id}?token={auth_token}")
    assert del_res.status_code == 200

    # Should not appear in main list
    list_res = client.get(f"/api/assignments?token={auth_token}")
    ids = [a["id"] for a in list_res.json()]
    assert assignment_id not in ids

def test_trash_contains_deleted(client, auth_token):
    create_res = client.post(f"/api/assignments?token={auth_token}", json={
        "title": "Trashed Assignment", "source": "manual"
    })
    assignment_id = create_res.json()["id"]
    client.delete(f"/api/assignments/{assignment_id}?token={auth_token}")

    trash_res = client.get(f"/api/assignments/trash?token={auth_token}")
    assert trash_res.status_code == 200
    ids = [a["id"] for a in trash_res.json()]
    assert assignment_id in ids

def test_restore_assignment(client, auth_token):
    create_res = client.post(f"/api/assignments?token={auth_token}", json={
        "title": "Restore Me", "source": "manual"
    })
    assignment_id = create_res.json()["id"]
    client.delete(f"/api/assignments/{assignment_id}?token={auth_token}")

    restore_res = client.put(f"/api/assignments/{assignment_id}/restore?token={auth_token}")
    assert restore_res.status_code == 200

    # Should appear back in main list
    list_res = client.get(f"/api/assignments?token={auth_token}")
    ids = [a["id"] for a in list_res.json()]
    assert assignment_id in ids

def test_permanent_delete(client, auth_token):
    create_res = client.post(f"/api/assignments?token={auth_token}", json={
        "title": "Permanent Gone", "source": "manual"
    })
    assignment_id = create_res.json()["id"]
    client.delete(f"/api/assignments/{assignment_id}?token={auth_token}")

    perm_res = client.delete(f"/api/assignments/{assignment_id}/permanent?token={auth_token}")
    assert perm_res.status_code == 200

    # Should not appear in trash either
    trash_res = client.get(f"/api/assignments/trash?token={auth_token}")
    ids = [a["id"] for a in trash_res.json()]
    assert assignment_id not in ids

def test_delete_nonexistent_assignment(client, auth_token):
    res = client.delete(f"/api/assignments/99999?token={auth_token}")
    assert res.status_code == 404
