from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Assignment, Team, TeamMembership
from app.routes.assignments import get_current_user
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
def list_my_teams(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    memberships = db.query(TeamMembership).filter(TeamMembership.user_id == user.id).all()
    return [m.team for m in memberships]

@router.get("/team/{team_id}", response_model=TeamOverviewResponse)
def get_team_overview(team_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)

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
        assignments = db.query(Assignment).filter(
            Assignment.user_id == m.id,
            Assignment.deleted_at == None
        ).all()
        result_members.append({
            "user_id": m.id,
            "full_name": m.full_name,
            "email": m.email,
            "assignments": assignments,
        })

    return {"team": team, "members": result_members}

@router.post("/team/create", response_model=TeamInfo)
def create_team(data: TeamCreate, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)

    new_team = Team(name=data.name, join_code=generate_join_code(db))
    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    membership = TeamMembership(user_id=user.id, team_id=new_team.id)
    db.add(membership)
    db.commit()

    return new_team

@router.post("/team/join", response_model=TeamInfo)
def join_team(data: TeamJoin, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)

    team = db.query(Team).filter(Team.join_code == data.join_code.upper()).first()
    if not team:
        raise HTTPException(status_code=404, detail="Invalid join code.")

    existing = db.query(TeamMembership).filter(
        TeamMembership.user_id == user.id,
        TeamMembership.team_id == team.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You're already a member of this team.")

    membership = TeamMembership(user_id=user.id, team_id=team.id)
    db.add(membership)
    db.commit()

    return team

@router.post("/team/{team_id}/leave")
def leave_team(team_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)

    membership = db.query(TeamMembership).filter(
        TeamMembership.user_id == user.id,
        TeamMembership.team_id == team_id
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="You're not a member of this team.")

    db.delete(membership)
    db.commit()
    return {"message": "Left team."}