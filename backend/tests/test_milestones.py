"""
Integration tests for milestone creation and completion toggling.
"""

def make_assignment(client, auth_headers, title="Test Assignment"):
    res = client.post("/api/assignments", headers=auth_headers, json={
        "title": title, "source": "manual"
    })
    return res.json()["id"]

def test_create_milestone(client, auth_headers):
    assignment_id = make_assignment(client, auth_headers)
    res = client.post(f"/api/assignments/{assignment_id}/milestones", headers=auth_headers, json={
        "title": "Research phase",
        "description": "Read all papers",
        "estimated_hours": 3
    })
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Research phase"
    assert data["is_completed"] == False

def test_get_milestones(client, auth_headers):
    assignment_id = make_assignment(client, auth_headers)
    client.post(f"/api/assignments/{assignment_id}/milestones", headers=auth_headers, json={"title": "Step 1"})
    client.post(f"/api/assignments/{assignment_id}/milestones", headers=auth_headers, json={"title": "Step 2"})

    res = client.get(f"/api/assignments/{assignment_id}/milestones", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) == 2

def test_toggle_milestone_completion(client, auth_headers):
    assignment_id = make_assignment(client, auth_headers)
    m_res = client.post(f"/api/assignments/{assignment_id}/milestones", headers=auth_headers, json={"title": "Do task"})
    milestone_id = m_res.json()["id"]

    # Toggle on
    toggle_res = client.put(f"/api/assignments/{assignment_id}/milestones/{milestone_id}", headers=auth_headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_completed"] == True

    # Toggle off
    toggle_res2 = client.put(f"/api/assignments/{assignment_id}/milestones/{milestone_id}", headers=auth_headers)
    assert toggle_res2.json()["is_completed"] == False

def test_delete_milestone(client, auth_headers):
    assignment_id = make_assignment(client, auth_headers)
    m_res = client.post(f"/api/assignments/{assignment_id}/milestones", headers=auth_headers, json={"title": "Remove me"})
    milestone_id = m_res.json()["id"]

    del_res = client.delete(f"/api/assignments/{assignment_id}/milestones/{milestone_id}", headers=auth_headers)
    assert del_res.status_code == 200

    list_res = client.get(f"/api/assignments/{assignment_id}/milestones", headers=auth_headers)
    ids = [m["id"] for m in list_res.json()]
    assert milestone_id not in ids
