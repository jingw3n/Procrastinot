import httpx
import re
import os
import asyncio
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

        # Collect new assignments that need to be added (skip duplicates)
        pending = []
        for course in courses:
            course_id = course.get("id")
            course_name = course.get("name", "Unknown Course")
            course_code = course.get("course_code", "")

            assignments_res = await client.get(
                f"{canvas_base_url}/api/v1/courses/{course_id}/assignments?per_page=50",
                headers=headers
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
                pending.append((ca, course_code or course_name, canvas_id))

        if not pending:
            return {"message": "Synced 0 new assignments from Canvas"}

        # Run all Claude summarization calls in parallel threads
        raw_descriptions = [strip_html(ca.get("description")) for ca, _, _ in pending]
        summaries = await asyncio.gather(*[
            asyncio.to_thread(summarize_description, d) for d in raw_descriptions
        ])

        now = datetime.now(timezone.utc)
        for (ca, course_label, canvas_id), summary in zip(pending, summaries):
            due_date = datetime.fromisoformat(ca["due_at"].replace("Z", "+00:00"))
            status = AssignmentStatus.upcoming if due_date > now else AssignmentStatus.overdue
            db.add(Assignment(
                user_id=user.id,
                title=ca.get("name", "Untitled"),
                description=summary,
                due_date=due_date,
                estimated_hours=2.0,
                course=course_label,
                status=status,
                source=AssignmentSource.canvas,
                source_filename=canvas_id,
            ))

        db.commit()

    return {"message": f"Synced {len(pending)} new assignments from Canvas"}