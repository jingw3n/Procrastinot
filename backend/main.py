from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SQLALCHEMY_DATABASE_URL
from app.routes import auth, dashboard, upload

print(f"Connecting to: {SQLALCHEMY_DATABASE_URL}")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Procrastinot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://procrastinot-nine.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(upload.router, prefix="/api", tags=["upload"])

from app.routes import assignments
app.include_router(assignments.router, prefix="/api", tags=["assignments"])

@app.get("/")
def root():
    return {"message": "Procrastinot API is running!"}