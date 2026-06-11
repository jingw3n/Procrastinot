from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Assignment, AssignmentStatus, User
from app.routes.auth import SECRET_KEY, ALGORITHM
from jose import JWTError, jwt

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        return {"upcoming": 0, "overdue": 0, "total": 0}
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"upcoming": 0, "overdue": 0, "total": 0}
    assignments = db.query(Assignment).filter(Assignment.user_id == user.id).all()
    return {
        "upcoming": sum(1 for a in assignments if a.status == AssignmentStatus.upcoming),
        "overdue": sum(1 for a in assignments if a.status == AssignmentStatus.overdue),
        "total": len(assignments)
    }