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

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    courses = relationship("Course", back_populates="user", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="courses")
    assignments = relationship("Assignment", back_populates="course", cascade="all, delete-orphan")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    estimated_hours = Column(Float, nullable=True)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.upcoming)
    source = Column(Enum(AssignmentSource), default=AssignmentSource.manual)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="assignments")
    course = relationship("Course", back_populates="assignments")
    milestones = relationship("Milestone", back_populates="assignment", cascade="all, delete-orphan")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assignment = relationship("Assignment", back_populates="milestones")