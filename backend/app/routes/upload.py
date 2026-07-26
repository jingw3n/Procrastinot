from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Assignment, AssignmentStatus, AssignmentSource, Milestone, User
from app.routes.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import pdfplumber
import anthropic
import io
import os
import json

router = APIRouter()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()

def call_claude_api(text: str) -> List[dict]:
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompt = f"""You are an academic assistant. Extract assignments from the following course document.

Group related tasks under a single assignment. Sub-tasks like "submit file", "sign up", or "prepare draft" should be milestones under the main assignment, not separate assignments.

Return ONLY a valid JSON array with no extra text. Each item should have:
- title (string): name of the main assignment or deliverable
- due_date (string or null): final due date in YYYY-MM-DD format if found, otherwise null
- description (string or null): brief description of the assignment
- estimated_hours (number or null): estimated hours to complete if mentioned, otherwise make a reasonable estimate based on the type and complexity of the task
- course (string or null): course name or code if mentioned
- milestones (array): list of sub-tasks, each with:
  - title (string): name of the sub-task
  - due_date (string or null): due date in YYYY-MM-DD format if explicitly mentioned; if not mentioned but the assignment has a final due date, suggest a date by spreading milestones evenly before the deadline in chronological order
  - description (string or null): brief description
  - estimated_hours (number or null): estimated hours for this sub-task

Only create a separate top-level assignment if it is clearly a distinct, standalone task (e.g. a different exam, a different project). If in doubt, group it as a milestone.

Document:
{text}

Return only the JSON array, nothing else."""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        temperature=0,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = message.content[0].text.strip()
    
    # Clean up if Claude wraps in markdown code blocks
    if response_text.startswith("```"):
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]
    
    return json.loads(response_text)


# Step 1: Upload PDF and extract — does NOT save to DB yet
@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not (file.filename.endswith(".pdf") or file.filename.endswith(".txt")):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are allowed")

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if len(file_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")

    # Extract text in memory — no file saved to disk
    if file.filename.endswith(".txt"):
        text = file_bytes.decode("utf-8", errors="ignore").strip()
    else:
        text = extract_text_from_pdf(file_bytes)

    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract readable text from this PDF. Please check the file and try again.")

    # Call Claude API
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="Claude API key not configured")

    try:
        extracted = call_claude_api(text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse Claude response. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")

    if not extracted or len(extracted) == 0:
        raise HTTPException(status_code=400, detail="No assignments found in this document. Please check the file.")

    return {"extracted": extracted}


class PastedTextRequest(BaseModel):
    text: str

@router.post("/upload-text")
def upload_text(data: PastedTextRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not data.text or len(data.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Text is too short to extract assignments from.")

    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="Claude API key not configured")

    try:
        extracted = call_claude_api(data.text.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse Claude response. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")

    if not extracted or len(extracted) == 0:
        raise HTTPException(status_code=400, detail="No assignments found in this text.")

    return {"extracted": extracted}


class ExtractedMilestone(BaseModel):
    title: str
    due_date: Optional[str] = None
    description: Optional[str] = None
    estimated_hours: Optional[float] = None

class ExtractedAssignment(BaseModel):
    title: str
    due_date: Optional[str] = None
    description: Optional[str] = None
    estimated_hours: Optional[float] = None
    course: Optional[str] = None
    milestones: Optional[List[ExtractedMilestone]] = []


class ConfirmUploadRequest(BaseModel):
    assignments: List[ExtractedAssignment]
    filename: Optional[str] = None


# Step 2: User confirms — save to DB
@router.post("/confirm-upload")
def confirm_upload(data: ConfirmUploadRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = current_user

    saved = []
    for item in data.assignments:
        due_date = None
        if item.due_date:
            try:
                due_date = datetime.strptime(item.due_date, "%Y-%m-%d")
            except ValueError:
                due_date = None

        assignment = Assignment(
            user_id=user.id,
            title=item.title,
            description=item.description,
            due_date=due_date,
            estimated_hours=item.estimated_hours,
            course=item.course,
            status=AssignmentStatus.upcoming,
            source=AssignmentSource.pdf,
            source_filename=data.filename,
        )
        db.add(assignment)
        db.flush()  # get assignment.id before commit

        for m in (item.milestones or []):
            milestone_due = None
            if m.due_date:
                try:
                    milestone_due = datetime.strptime(m.due_date, "%Y-%m-%d")
                except ValueError:
                    pass
            db.add(Milestone(
                assignment_id=assignment.id,
                title=m.title,
                description=m.description,
                due_date=milestone_due,
                estimated_hours=m.estimated_hours,
                is_completed=False,
            ))

        saved.append(item.title)

    db.commit()
    return {"message": f"Saved {len(saved)} assignments", "saved": saved}