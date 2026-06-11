from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Assignment, Course, Milestone, User
from app.schemas import (
    AssignmentCreate, AssignmentUpdate, AssignmentResponse,
    CourseCreate, CourseResponse,
    MilestoneCreate, MilestoneResponse
)
from jose import JWTError, jwt
from app.routes.auth import SECRET_KEY, ALGORITHM
from typing import List

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
    return db.query(Assignment).filter(Assignment.user_id == user.id).all()

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
    for key, value in data.dict(exclude_unset=True).items():
        setattr(assignment, key, value)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.user_id == user.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted"}

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