from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Assignment, AssignmentSource
from app.routes.auth import get_current_user

router = APIRouter()


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/admin/users")
def list_users(current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        count = db.query(Assignment).filter(
            Assignment.user_id == u.id,
            Assignment.deleted_at == None
        ).count()
        result.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "assignment_count": count,
            "is_admin": u.is_admin or False,
        })
    return result


@router.get("/admin/stats")
def get_stats(current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_assignments = db.query(Assignment).filter(Assignment.deleted_at == None).count()
    pdf_count = db.query(Assignment).filter(
        Assignment.source == AssignmentSource.pdf,
        Assignment.deleted_at == None
    ).count()
    canvas_count = db.query(Assignment).filter(
        Assignment.source == AssignmentSource.canvas,
        Assignment.deleted_at == None
    ).count()
    manual_count = db.query(Assignment).filter(
        Assignment.source == AssignmentSource.manual,
        Assignment.deleted_at == None
    ).count()
    return {
        "total_users": total_users,
        "total_assignments": total_assignments,
        "by_source": {
            "pdf": pdf_count,
            "canvas": canvas_count,
            "manual": manual_count,
        },
    }
