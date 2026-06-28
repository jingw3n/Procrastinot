import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Assignment, AssignmentStatus, AssignmentSource
from app.routes.auth import SECRET_KEY, ALGORITHM
from jose import JWTError, jwt
from datetime import datetime, timezone

router = APIRouter()

def get_current_user(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Save Canvas token
@router.post("/canvas/token")
def save_canvas_token(canvas_token: str, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    user.canvas_token = canvas_token
    db.commit()
    return {"message": "Canvas token saved successfully"}

# Sync Canvas assignments
@router.post("/canvas/sync")
async def sync_canvas(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)

    if not user.canvas_token:
        raise HTTPException(status_code=400, detail="No Canvas token found. Please add your Canvas API token first.")

    canvas_base_url = "https://canvas.nus.edu.sg"
    headers = {"Authorization": f"Bearer {user.canvas_token}"}

    async with httpx.AsyncClient() as client:
        # Fetch courses
        courses_res = await client.get(f"{canvas_base_url}/api/v1/courses?enrollment_state=active&per_page=50", headers=headers)
        if courses_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Canvas courses. Check your token.")
        courses = courses_res.json()

        synced = 0
        for course in courses:
            course_id = course.get("id")
            course_name = course.get("name", "Unknown Course")
            course_code = course.get("course_code", "")

            # Fetch assignments for each course
            assignments_res = await client.get(
                f"{canvas_base_url}/api/v1/courses/{course_id}/assignments?per_page=50",
                headers=headers
            )
            if assignments_res.status_code != 200:
                continue

            canvas_assignments = assignments_res.json()

            for ca in canvas_assignments:
                # Skip if no due date
                if not ca.get("due_at"):
                    continue

                # Check if already exists (avoid duplicates)
                canvas_id = str(ca.get("id"))
                existing = db.query(Assignment).filter(
                    Assignment.user_id == user.id,
                    Assignment.source == AssignmentSource.canvas,
                    Assignment.description.contains(f"canvas_id:{canvas_id}")
                ).first()

                if existing:
                    continue

                due_date = datetime.fromisoformat(ca["due_at"].replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)
                status = AssignmentStatus.upcoming if due_date > now else AssignmentStatus.overdue

                new_assignment = Assignment(
                    user_id=user.id,
                    title=ca.get("name", "Untitled"),
                    description=f"{ca.get('description') or ''}\ncanvas_id:{canvas_id}",
                    due_date=due_date,
                    estimated_hours=2.0,  # default estimate
                    status=status,
                    source=AssignmentSource.canvas,
                )
                db.add(new_assignment)
                synced += 1

        db.commit()

    return {"message": f"Synced {synced} new assignments from Canvas"}