from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SQLALCHEMY_DATABASE_URL
from app.routes import auth, dashboard, upload

print(f"Connecting to: {SQLALCHEMY_DATABASE_URL}")

Base.metadata.create_all(bind=engine)

# Add new columns to existing tables if they don't exist
from sqlalchemy import text
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE assignments ADD COLUMN source_filename VARCHAR"))
        conn.commit()
    except Exception:
        pass  # Column already exists

app = FastAPI(title="Procrastinot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://procrastinot-nine.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(upload.router, prefix="/api", tags=["upload"])

from app.routes import assignments
app.include_router(assignments.router, prefix="/api", tags=["assignments"])

from app.routes import canvas
app.include_router(canvas.router, prefix="/api", tags=["canvas"])

@app.get("/")
def root():
    return {"message": "Procrastinot API is running!"}