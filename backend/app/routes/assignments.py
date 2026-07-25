from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Assignment, Course, Milestone, User
from datetime import datetime, timezone
from app.schemas import (
    AssignmentCreate, AssignmentUpdate, AssignmentResponse,
    CourseCreate, CourseResponse,
    MilestoneCreate, MilestoneUpdate, MilestoneResponse
)
from jose import JWTError, jwt
from app.routes.auth import SECRET_KEY, ALGORITHM
from typing import List
from pydantic import BaseModel
import anthropic
import os
import json

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

# --- Assignments ---

@router.get("/assignments", response_model=List[AssignmentResponse])
def get_assignments(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    return db.query(Assignment).filter(Assignment.user_id == user.id, Assignment.deleted_at == None).all()

@router.get("/assignments/trash", response_model=List[AssignmentResponse])
def get_trash(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    return db.query(Assignment).filter(Assignment.user_id == user.id, Assignment.deleted_at != None).all()

@router.put("/assignments/{assignment_id}/restore", response_model=AssignmentResponse)
def restore_assignment(assignment_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.deleted_at = None
    db.commit()
    db.refresh(assignment)
    return assignment

@router.post("/assignments", response_model=AssignmentResponse)
def create_assignment(assignment: AssignmentCreate, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    new_assignment = Assignment(**assignment.dict(), user_id=user.id)
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

@router.put("/assignments/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(assignment_id: int, data: AssignmentUpdate, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
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
def delete_assignment(assignment_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Assignment moved to trash"}

@router.delete("/assignments/{assignment_id}/permanent")
def permanent_delete(assignment_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment permanently deleted"}

# --- Courses ---

@router.get("/courses", response_model=List[CourseResponse])
def get_courses(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    return db.query(Course).filter(Course.user_id == user.id).all()

@router.post("/courses", response_model=CourseResponse)
def create_course(course: CourseCreate, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    new_course = Course(**course.dict(), user_id=user.id)
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

# --- Milestones ---

@router.get("/assignments/{assignment_id}/milestones", response_model=List[MilestoneResponse])
def get_milestones(assignment_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment.milestones

@router.post("/assignments/{assignment_id}/milestones", response_model=MilestoneResponse)
def create_milestone(assignment_id: int, milestone: MilestoneCreate, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
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
def decompose_assignment(assignment_id: int, data: DecomposeRequest, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
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
def toggle_milestone(assignment_id: int, milestone_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
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
def update_milestone(assignment_id: int, milestone_id: int, data: MilestoneUpdate, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
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
def delete_milestone(assignment_id: int, milestone_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id, Milestone.assignment_id == assignment_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    db.delete(milestone)
    db.commit()
    return {"message": "Milestone deleted"}