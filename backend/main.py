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
    for col_sql in [
        "ALTER TABLE assignments ADD COLUMN source_filename VARCHAR",
        "ALTER TABLE assignments ADD COLUMN course VARCHAR",
        "ALTER TABLE milestones ADD COLUMN estimated_hours FLOAT",
        "ALTER TABLE assignments ADD COLUMN deleted_at TIMESTAMP",
        "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE",
        "ALTER TABLE teams ADD COLUMN course_code VARCHAR",
    ]:
        try:
            conn.execute(text(col_sql))
            conn.commit()
        except Exception:
            pass  # Column already exists

    # Add indexes for commonly filtered columns
    for idx_sql in [
        "CREATE INDEX IF NOT EXISTS ix_assignments_deleted_at ON assignments (deleted_at)",
        "CREATE INDEX IF NOT EXISTS ix_assignments_status ON assignments (status)",
        "CREATE INDEX IF NOT EXISTS ix_assignments_user_id_deleted ON assignments (user_id, deleted_at)",
    ]:
        try:
            conn.execute(text(idx_sql))
            conn.commit()
        except Exception:
            pass

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

from app.routes import admin
app.include_router(admin.router, prefix="/api", tags=["admin"])

from app.routes import team
app.include_router(team.router, prefix="/api", tags=["team"])

@app.get("/")
def root():
    return {"message": "Procrastinot API is running!"}

# --- Auto Canvas Sync every 3 hours ---
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.database import SessionLocal
from app.models import User
from app.routes.canvas import strip_html, summarize_description
from app.models import Assignment, AssignmentStatus, AssignmentSource
from datetime import datetime, timezone
import httpx as _httpx

async def auto_sync_all_users():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.canvas_token != None).all()
        canvas_base_url = "https://canvas.nus.edu.sg"
        for user in users:
            try:
                async with _httpx.AsyncClient(timeout=30) as client:
                    courses_res = await client.get(
                        f"{canvas_base_url}/api/v1/courses?enrollment_state=active&per_page=50",
                        headers={"Authorization": f"Bearer {user.canvas_token}"}
                    )
                    if courses_res.status_code != 200:
                        continue
                    for course in courses_res.json():
                        course_id = course.get("id")
                        course_code = course.get("course_code", "") or course.get("name", "")
                        assignments_res = await client.get(
                            f"{canvas_base_url}/api/v1/courses/{course_id}/assignments?per_page=50",
                            headers={"Authorization": f"Bearer {user.canvas_token}"}
                        )
                        if assignments_res.status_code != 200:
                            continue
                        for ca in assignments_res.json():
                            if not ca.get("due_at"):
                                continue
                            canvas_id = str(ca.get("id"))
                            existing = db.query(Assignment).filter(
                                Assignment.user_id == user.id,
                                Assignment.source == AssignmentSource.canvas,
                                Assignment.source_filename == canvas_id
                            ).first()
                            if existing:
                                continue
                            due_date = datetime.fromisoformat(ca["due_at"].replace("Z", "+00:00"))
                            now = datetime.now(timezone.utc)
                            status = AssignmentStatus.upcoming if due_date > now else AssignmentStatus.overdue
                            raw_desc = strip_html(ca.get("description"))
                            db.add(Assignment(
                                user_id=user.id,
                                title=ca.get("name", "Untitled"),
                                description=summarize_description(raw_desc),
                                due_date=due_date,
                                estimated_hours=2.0,
                                course=course_code,
                                status=status,
                                source=AssignmentSource.canvas,
                                source_filename=canvas_id,
                            ))
                        db.commit()
            except Exception:
                pass
    finally:
        db.close()

import os as _os
if not _os.environ.get("PYTEST_RUNNING"):
    scheduler = AsyncIOScheduler()
    scheduler.add_job(auto_sync_all_users, "interval", hours=3)

    @app.on_event("startup")
    async def start_scheduler():
        scheduler.start()