from datetime import UTC, datetime, timedelta


def in_hours(hours: float) -> str:
    return (datetime.now(UTC) + timedelta(hours=hours)).isoformat()


# --- Creating leads ---------------------------------------------------------


def test_create_lead_defaults_to_new(client):
    response = client.post("/api/leads", json={"name": "  Ravi Kumar  "})

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Ravi Kumar"
    assert body["status"] == "new"
    assert body["company"] is None
    assert body["last_note"] is None


def test_create_lead_requires_name(client):
    response = client.post("/api/leads", json={"name": "   ", "company": "Acme"})

    assert response.status_code == 422
    assert "name" in response.json()["errors"]


def test_create_lead_treats_blank_optional_fields_as_empty(client):
    response = client.post("/api/leads", json={"name": "Ravi", "company": " ", "phone": ""})

    assert response.status_code == 201
    assert response.json()["company"] is None
    assert response.json()["phone"] is None


def test_create_lead_rejects_bad_phone(client):
    response = client.post("/api/leads", json={"name": "Ravi", "phone": "call me maybe"})

    assert response.status_code == 422
    assert "phone" in response.json()["errors"]


# --- Reading leads ----------------------------------------------------------


def test_get_unknown_lead_returns_404(client):
    response = client.get("/api/leads/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Lead 999 not found."


def test_list_filters_by_status_and_search(client):
    client.post("/api/leads", json={"name": "Asha Mehta"})
    client.post("/api/leads", json={"name": "Ravi Kumar", "status": "won"})
    client.post("/api/leads", json={"name": "Ravina Shah", "status": "won"})

    won = client.get("/api/leads", params={"status": "won"}).json()
    assert {lead["name"] for lead in won} == {"Ravi Kumar", "Ravina Shah"}

    searched = client.get("/api/leads", params={"search": "ravi"}).json()
    assert {lead["name"] for lead in searched} == {"Ravi Kumar", "Ravina Shah"}

    both = client.get("/api/leads", params={"status": "won", "search": "shah"}).json()
    assert [lead["name"] for lead in both] == ["Ravina Shah"]


def test_search_treats_wildcards_literally(client):
    client.post("/api/leads", json={"name": "Asha Mehta"})

    assert client.get("/api/leads", params={"search": "%"}).json() == []


def test_list_rejects_unknown_status(client):
    response = client.get("/api/leads", params={"status": "maybe"})

    assert response.status_code == 422


def test_counts_include_every_status(client):
    client.post("/api/leads", json={"name": "A"})
    client.post("/api/leads", json={"name": "B", "status": "won"})

    counts = client.get("/api/leads/counts").json()

    assert counts["total"] == 2
    assert counts["by_status"]["new"] == 1
    assert counts["by_status"]["won"] == 1
    assert counts["by_status"]["lost"] == 0


# --- Updating leads ---------------------------------------------------------


def test_update_status_persists(client, lead):
    response = client.patch(f"/api/leads/{lead['id']}", json={"status": "qualified"})

    assert response.status_code == 200
    assert client.get(f"/api/leads/{lead['id']}").json()["status"] == "qualified"


def test_update_rejects_null_status(client, lead):
    response = client.patch(f"/api/leads/{lead['id']}", json={"status": None})

    assert response.status_code == 422


def test_update_with_empty_body_is_bad_request(client, lead):
    response = client.patch(f"/api/leads/{lead['id']}", json={})

    assert response.status_code == 400


def test_follow_up_can_be_cleared(client, lead):
    client.patch(f"/api/leads/{lead['id']}", json={"follow_up_at": in_hours(2)})

    response = client.patch(f"/api/leads/{lead['id']}", json={"follow_up_at": None})

    assert response.status_code == 200
    assert response.json()["follow_up_at"] is None


def test_update_unknown_lead_returns_404(client):
    response = client.patch("/api/leads/999", json={"status": "won"})

    assert response.status_code == 404


# --- Discussions ------------------------------------------------------------


def test_discussions_are_newest_first(client, lead):
    for note in ("First call", "Sent deck", "Pricing questions"):
        assert client.post(f"/api/leads/{lead['id']}/discussions", json={"note": note}).status_code == 201

    notes = [d["note"] for d in client.get(f"/api/leads/{lead['id']}/discussions").json()]

    assert notes == ["Pricing questions", "Sent deck", "First call"]


def test_discussion_updates_lead_summary_and_follow_up(client, lead):
    follow_up = in_hours(3)

    response = client.post(
        f"/api/leads/{lead['id']}/discussions",
        json={"note": "Wants a demo on Friday", "follow_up_at": follow_up},
    )

    assert response.status_code == 201
    summary = client.get(f"/api/leads/{lead['id']}").json()
    assert summary["last_note"] == "Wants a demo on Friday"
    assert summary["last_discussion_at"] is not None
    assert datetime.fromisoformat(summary["follow_up_at"]) == datetime.fromisoformat(follow_up)


def test_discussion_without_follow_up_keeps_existing_one(client, lead):
    follow_up = in_hours(5)
    client.post(f"/api/leads/{lead['id']}/discussions", json={"note": "Call 1", "follow_up_at": follow_up})

    client.post(f"/api/leads/{lead['id']}/discussions", json={"note": "Quick email"})

    summary = client.get(f"/api/leads/{lead['id']}").json()
    assert datetime.fromisoformat(summary["follow_up_at"]) == datetime.fromisoformat(follow_up)


def test_discussion_rejects_follow_up_in_the_past(client, lead):
    response = client.post(
        f"/api/leads/{lead['id']}/discussions",
        json={"note": "Too late", "follow_up_at": in_hours(-2)},
    )

    assert response.status_code == 422
    assert "follow_up_at" in response.json()["errors"]


def test_discussion_rejects_naive_datetime(client, lead):
    response = client.post(
        f"/api/leads/{lead['id']}/discussions",
        json={"note": "No timezone", "follow_up_at": "2030-01-01T10:00:00"},
    )

    assert response.status_code == 422


def test_discussion_requires_note(client, lead):
    response = client.post(f"/api/leads/{lead['id']}/discussions", json={"note": "  "})

    assert response.status_code == 422


def test_discussion_on_unknown_lead_returns_404(client):
    response = client.post("/api/leads/999/discussions", json={"note": "Hello"})

    assert response.status_code == 404


def test_list_is_ordered_by_latest_activity(client):
    older = client.post("/api/leads", json={"name": "Older"}).json()
    client.post("/api/leads", json={"name": "Newer"})

    client.post(f"/api/leads/{older['id']}/discussions", json={"note": "Just spoke"})

    names = [lead["name"] for lead in client.get("/api/leads").json()]
    assert names == ["Older", "Newer"]


def test_validation_messages_are_human_readable(client):
    response = client.post("/api/leads", json={"name": "", "phone": "call me"})

    assert response.json()["errors"] == {
        "name": "Name is required.",
        "phone": "Use digits, spaces and + ( ) - only.",
    }
