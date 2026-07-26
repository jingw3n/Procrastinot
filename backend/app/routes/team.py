from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.database import get_db
from app.models import User, Assignment, Team, TeamMembership, Course
from app.routes.auth import get_current_user
from app.schemas import TeamCreate, TeamJoin, TeamInfo, TeamOverviewResponse
from typing import List
import secrets

router = APIRouter()

def generate_join_code(db: Session) -> str:
    while True:
        code = secrets.token_hex(3).upper()
        if not db.query(Team).filter(Team.join_code == code).first():
            return code

@router.get("/teams", response_model=List[TeamInfo])
def list_my_teams(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user
    memberships = db.query(TeamMembership).filter(TeamMembership.user_id == user.id).all()
    return [m.team for m in memberships]

@router.get("/team/{team_id}", response_model=TeamOverviewResponse)
def get_team_overview(team_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user
    membership = db.query(TeamMembership).filter(
        TeamMembership.user_id == user.id,
        TeamMembership.team_id == team_id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this team.")
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    member_users = (
        db.query(User)
        .join(TeamMembership, TeamMembership.user_id == User.id)
        .filter(TeamMembership.team_id == team_id)
        .all()
    )
    result_members = []
    for m in member_users:
        query = db.query(Assignment).outerjoin(Course, Assignment.course_id == Course.id).filter(
            Assignment.user_id == m.id,
            Assignment.deleted_at == None
        )
        if team.course_code:
            code = team.course_code.strip().lower()
            query = query.filter(
                or_(
                    func.lower(Assignment.course).like(f"%{code}%"),
                    func.lower(Course.code).like(f"%{code}%")
                )
            )
        assignments = query.all()
        result_members.append({
            "user_id": m.id, "full_name": m.full_name, "email": m.email, "assignments": assignments,
        })
    return {"team": team, "members": result_members}

@router.post("/team/create", response_model=TeamInfo)
def create_team(data: TeamCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user
    new_team = Team(name=data.name, course_code=data.course_code, join_code=generate_join_code(db))
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    membership = TeamMembership(user_id=user.id, team_id=new_team.id)
    db.add(membership)
    db.commit()
    return new_team

@router.post("/team/join", response_model=TeamInfo)
def join_team(data: TeamJoin, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user
    team = db.query(Team).filter(Team.join_code == data.join_code.upper()).first()
    if not team:
        raise HTTPException(status_code=404, detail="Invalid join code.")
    existing = db.query(TeamMembership).filter(
        TeamMembership.user_id == user.id, TeamMembership.team_id == team.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You're already a member of this team.")
    membership = TeamMembership(user_id=user.id, team_id=team.id)
    db.add(membership)
    db.commit()
    return team

@router.post("/team/{team_id}/leave")
def leave_team(team_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user
    membership = db.query(TeamMembership).filter(
        TeamMembership.user_id == user.id, TeamMembership.team_id == team_id
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="You're not a member of this team.")
    db.delete(membership)
    db.commit()
    return {"message": "Left team."}