import os
import tempfile
from pathlib import Path

# Point the app at a throwaway database before anything imports app.database.
_db_dir = tempfile.mkdtemp(prefix="leadflow-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_db_dir) / 'test.db'}"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def lead(client):
    response = client.post("/api/leads", json={"name": "Asha Mehta", "company": "Northwind"})
    assert response.status_code == 201
    return response.json()
