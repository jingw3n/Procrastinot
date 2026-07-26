import httpx
import re
import os
import anthropic
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Assignment, AssignmentStatus, AssignmentSource
from app.routes.auth import get_current_user
from datetime import datetime, timezone

def summarize_description(text: str) -> str:
    if not text or len(text) < 100:
        return text
    try:
        client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=150,
            messages=[{"role": "user", "content": f"Summarize this university assignment description in 2-3 clear sentences. Focus on what the student needs to do, the submission format, and the deadline if mentioned. Be concise.\n\n{text}"}]
        )
        return message.content[0].text.strip()
    except Exception:
        return text

def strip_html(text: str) -> str:
    if not text:
        return None
    clean = re.sub(r'<[^>]+>', '', text)
    clean = re.sub(r'&nbsp;', ' ', clean)
    clean = re.sub(r'&amp;', '&', clean)
    clean = re.sub(r'&lt;', '<', clean)
    clean = re.sub(r'&gt;', '>', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean or None

router = APIRouter()

# Save Canvas token
@router.post("/canvas/token")
def save_canvas_token(canvas_token: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.canvas_token = canvas_token
    db.commit()
    return {"message": "Canvas token saved successfully"}

# Sync Canvas assignments
@router.post("/canvas/sync")
async def sync_canvas(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user

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
                    Assignment.source_filename == canvas_id
                ).first()

                if existing:
                    continue

                due_date = datetime.fromisoformat(ca["due_at"].replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)
                status = AssignmentStatus.upcoming if due_date > now else AssignmentStatus.overdue

                raw_description = strip_html(ca.get("description"))
                summary = summarize_description(raw_description)

                new_assignment = Assignment(
                    user_id=user.id,
                    title=ca.get("name", "Untitled"),
                    description=summary,
                    due_date=due_date,
                    estimated_hours=2.0,
                    course=course_code or course_name,
                    status=status,
                    source=AssignmentSource.canvas,
                    source_filename=canvas_id,
                )
                db.add(new_assignment)
                synced += 1

        db.commit()

    return {"message": f"Synced {synced} new assignments from Canvas"}