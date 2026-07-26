from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Assignment, AssignmentStatus, User
from app.routes.auth import get_current_user

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignments = db.query(Assignment).filter(Assignment.user_id == current_user.id, Assignment.deleted_at == None).all()
    return {
        "upcoming": sum(1 for a in assignments if a.status == AssignmentStatus.upcoming),
        "overdue": sum(1 for a in assignments if a.status == AssignmentStatus.overdue),
        "total": len(assignments)
    }