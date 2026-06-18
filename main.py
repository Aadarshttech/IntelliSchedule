from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from config import Config
from models.database import engine, Base
import os

# Import all entity models so Base.metadata knows about them
from models.entities import (Course, Instructor, Room, TimeSlot, StudentGroup,
                              InstructorAvailability, Schedule, ScheduleEntry)

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Timetable System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api import api_router
app.include_router(api_router, prefix="/api")

# Mount static files
app.mount("/", StaticFiles(directory="static", html=True), name="static")

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

