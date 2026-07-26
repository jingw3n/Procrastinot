import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Use in-memory SQLite for tests
SQLALCHEMY_TEST_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test.db"):
        os.remove("test.db")

@pytest.fixture()
def client():
    from main import app
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture()
def auth_token(client):
    """Register a unique user per test and return their token."""
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    client.post("/auth/register", json={
        "full_name": "Test User",
        "email": email,
        "password": "testpassword123"
    })
    res = client.post("/auth/login", json={
        "email": email,
        "password": "testpassword123"
    })
    return res.json()["access_token"]

@pytest.fixture()
def auth_headers(auth_token):
    """Return Authorization header dict for use in test client calls."""
    return {"Authorization": f"Bearer {auth_token}"}
