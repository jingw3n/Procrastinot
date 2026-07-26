from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Assignment, Course, Milestone, User
from datetime import datetime, timezone, timedelta
from app.schemas import (
    AssignmentCreate, AssignmentUpdate, AssignmentResponse,
    CourseCreate, CourseResponse,
    MilestoneCreate, MilestoneUpdate, MilestoneResponse
)
from app.routes.auth import get_current_user
from typing import List
from pydantic import BaseModel
import anthropic
import os
import json
import csv
import io

router = APIRouter()

# --- Assignments ---

@router.get("/assignments", response_model=List[AssignmentResponse])
def get_assignments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Assignment).filter(Assignment.user_id == current_user.id, Assignment.deleted_at == None).all()

@router.get("/assignments/export")
def export_assignments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignments = db.query(Assignment).filter(Assignment.user_id == current_user.id, Assignment.deleted_at == None).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Title", "Course", "Status", "Due Date", "Estimated Hours", "Description", "Source"])
    for a in assignments:
        writer.writerow([
            a.title,
            a.course or "",
            a.status.value if hasattr(a.status, "value") else a.status,
            a.due_date.strftime("%Y-%m-%d") if a.due_date else "",
            a.estimated_hours or "",
            a.description or "",
            a.source.value if hasattr(a.source, "value") else a.source,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=assignments.csv"}
    )

@router.get("/assignments/export/ics")
def export_assignments_ics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignments = db.query(Assignment).filter(
        Assignment.user_id == current_user.id,
        Assignment.deleted_at == None
    ).all()

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Procrastinot//Procrastinot//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Procrastinot Assignments",
    ]

    for a in assignments:
        if not a.due_date:
            continue
        due = a.due_date
        dtstart = due.strftime("%Y%m%d")
        dtend = (due + timedelta(days=1)).strftime("%Y%m%d")
        uid = f"procrastinot-{a.id}@procrastinot"
        summary = a.title
        if a.course:
            summary = f"[{a.course}] {a.title}"
        description = (a.description or "").replace("\n", "\\n").replace(",", "\\,").replace(";", "\\;")

        lines += [
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTART;VALUE=DATE:{dtstart}",
            f"DTEND;VALUE=DATE:{dtend}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
            "BEGIN:VALARM",
            "TRIGGER:-P1D",
            "ACTION:DISPLAY",
            "DESCRIPTION:Assignment due tomorrow",
            "END:VALARM",
            "END:VEVENT",
        ]

    lines.append("END:VCALENDAR")
    ics_content = "\r\n".join(lines)

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=procrastinot.ics"}
    )

@router.get("/assignments/trash", response_model=List[AssignmentResponse])
def get_trash(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Assignment).filter(Assignment.user_id == current_user.id, Assignment.deleted_at != None).all()

@router.put("/assignments/{assignment_id}/restore", response_model=AssignmentResponse)
def restore_assignment(assignment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.deleted_at = None
    db.commit()
    db.refresh(assignment)
    return assignment

@router.post("/assignments", response_model=AssignmentResponse)
def create_assignment(assignment: AssignmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_assignment = Assignment(**assignment.dict(), user_id=current_user.id)
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

@router.put("/assignments/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(assignment_id: int, data: AssignmentUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    updated_fields = data.dict(exclude_unset=True)
    for key, value in updated_fields.items():
        setattr(assignment, key, value)
    # Recalculate status when due_date changes (unless status was explicitly set or assignment is completed)
    if "due_date" in updated_fields and "status" not in updated_fields:
        if assignment.status != "completed" and assignment.due_date is not None:
            now = datetime.now(timezone.utc)
            due = assignment.due_date
            if due.tzinfo is None:
                due = due.replace(tzinfo=timezone.utc)
            assignment.status = "overdue" if due < now else "upcoming"
    db.commit()
    db.refresh(assignment)
    return assignment

@router.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Assignment moved to trash"}

@router.delete("/assignments/{assignment_id}/permanent")
def permanent_delete(assignment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment permanently deleted"}

# --- Courses ---

@router.get("/courses", response_model=List[CourseResponse])
def get_courses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Course).filter(Course.user_id == current_user.id).all()

@router.post("/courses", response_model=CourseResponse)
def create_course(course: CourseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_course = Course(**course.dict(), user_id=current_user.id)
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

# --- Milestones ---

@router.get("/assignments/{assignment_id}/milestones", response_model=List[MilestoneResponse])
def get_milestones(assignment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment.milestones

@router.post("/assignments/{assignment_id}/milestones", response_model=MilestoneResponse)
def create_milestone(assignment_id: int, milestone: MilestoneCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    new_milestone = Milestone(**milestone.dict(), assignment_id=assignment_id)
    db.add(new_milestone)
    db.commit()
    db.refresh(new_milestone)
    return new_milestone


# --- Decomposition ---

class DecomposeRequest(BaseModel):
    num_milestones: int = 4

@router.post("/assignments/{assignment_id}/decompose")
def decompose_assignment(assignment_id: int, data: DecomposeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    prompt = f"""You are an academic assistant helping a student break down an assignment into manageable milestones.

Assignment: {assignment.title}
Description: {assignment.description or 'No description provided'}
Due Date: {assignment.due_date or 'Not specified'}
Estimated Hours: {assignment.estimated_hours or 'Not specified'}

Break this assignment into exactly {data.num_milestones} milestones the student should complete in order.

Return ONLY a valid JSON array with no extra text. Each milestone should have:
- title (string): short name of the milestone
- description (string): what to do in this milestone
- due_date (string or null): suggested due date in YYYY-MM-DD format, spread evenly before the assignment due date if known, otherwise null
- estimated_hours (number): estimated hours for this milestone

Return only the JSON array, nothing else."""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        temperature=0,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = message.content[0].text.strip()
    if response_text.startswith("```"):
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]

    try:
        milestones = json.loads(response_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse Claude response.")

    return {"milestones": milestones}


@router.put("/assignments/{assignment_id}/milestones/{milestone_id}")
def toggle_milestone(assignment_id: int, milestone_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id, Milestone.assignment_id == assignment_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    milestone.is_completed = not milestone.is_completed
    db.commit()
    db.refresh(milestone)
    return milestone

@router.patch("/assignments/{assignment_id}/milestones/{milestone_id}", response_model=MilestoneResponse)
def update_milestone(assignment_id: int, milestone_id: int, data: MilestoneUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id, Milestone.assignment_id == assignment_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(milestone, key, value)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.delete("/assignments/{assignment_id}/milestones/{milestone_id}")
def delete_milestone(assignment_id: int, milestone_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == current_user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id, Milestone.assignment_id == assignment_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    db.delete(milestone)
    db.commit()
    return {"message": "Milestone deleted"}