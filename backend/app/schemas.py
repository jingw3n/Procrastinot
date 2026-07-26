from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    is_admin: Optional[bool] = False
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ResetPassword(BaseModel):
    email: EmailStr
    new_password: str

from datetime import datetime

class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    course_id: Optional[int] = None
    source: Optional[str] = "manual"

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    status: Optional[str] = None
    course: Optional[str] = None
    course_id: Optional[int] = None

class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    estimated_hours: Optional[float]
    status: str
    source: str
    course: Optional[str] = None
    source_filename: Optional[str] = None
    course_id: Optional[int]
    created_at: datetime
    class Config:
        from_attributes = True

class CourseCreate(BaseModel):
    name: str
    code: Optional[str] = None

class CourseResponse(BaseModel):
    id: int
    name: str
    code: Optional[str]
    class Config:
        from_attributes = True

class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None

class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    is_completed: Optional[bool] = None

class MilestoneResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    estimated_hours: Optional[float] = None
    is_completed: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Team schemas
class TeamAssignmentDetail(AssignmentResponse):
    milestones: List[MilestoneResponse] = []

class TeamMemberAssignments(BaseModel):
    user_id: int
    full_name: str
    email: str
    assignments: List[TeamAssignmentDetail]
    class Config:
        from_attributes = True

class TeamCreate(BaseModel):
    name: str
    course_code: str

class TeamJoin(BaseModel):
    join_code: str

class TeamInfo(BaseModel):
    id: int
    name: str
    course_code: Optional[str] = None
    join_code: str
    class Config:
        from_attributes = True

class TeamOverviewResponse(BaseModel):
    team: TeamInfo
    members: List[TeamMemberAssignments]
    class Config:
        from_attributes = True

class CanvasUndatedSave(BaseModel):
    canvas_id: str
    title: str
    course: str
    description: Optional[str] = None
    due_date: str  # ISO date string, e.g. "2026-08-15"