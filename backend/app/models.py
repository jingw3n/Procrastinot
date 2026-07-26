from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class AssignmentStatus(str, enum.Enum):
    upcoming = "upcoming"
    in_progress = "in_progress"
    completed = "completed"
    overdue = "overdue"

class AssignmentSource(str, enum.Enum):
    pdf = "pdf"
    canvas = "canvas"
    manual = "manual"

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    course_code = Column(String, nullable=True)
    join_code = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    team_memberships = relationship("TeamMembership", back_populates="team", cascade="all, delete-orphan")

class TeamMembership(Base):
    __tablename__ = "team_memberships"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="team_memberships")
    team = relationship("Team", back_populates="team_memberships")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    canvas_token = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    courses = relationship("Course", back_populates="user", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="user", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMembership", back_populates="user", cascade="all, delete-orphan")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="courses")
    assignments = relationship("Assignment", back_populates="course_obj", cascade="all, delete-orphan")

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    estimated_hours = Column(Float, nullable=True)
    course = Column(String, nullable=True)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.upcoming)
    source = Column(Enum(AssignmentSource), default=AssignmentSource.manual)
    source_filename = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    user = relationship("User", back_populates="assignments")
    course_obj = relationship("Course", back_populates="assignments")
    milestones = relationship("Milestone", back_populates="assignment", cascade="all, delete-orphan")

class Milestone(Base):
    __tablename__ = "milestones"
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    estimated_hours = Column(Float, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    assignment = relationship("Assignment", back_populates="milestones")