from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard")
def get_dashboard():
    return {
        "upcoming": 6,
        "overdue": 2,
        "total": 9
    }