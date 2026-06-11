from pydantic import BaseModel, EmailStr
from typing import Optional

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

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ResetPassword(BaseModel):
    email: EmailStr
    new_password: str

from datetime import datetime

# Assignment schemas
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
    course_id: Optional[int] = None

class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    estimated_hours: Optional[float]
    status: str
    source: str
    course_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

# Course schemas
class CourseCreate(BaseModel):
    name: str
    code: Optional[str] = None

class CourseResponse(BaseModel):
    id: int
    name: str
    code: Optional[str]

    class Config:
        from_attributes = True

# Milestone schemas
class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None

class MilestoneResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True