from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db
from models.entities import Schedule

router = APIRouter()

@router.get("/{id}/json")
def export_json(id: int, db: Session = Depends(get_db)):
    sched = db.query(Schedule).filter(Schedule.id == id).first()
    if not sched: raise HTTPException(status_code=404)
    
    res = []
    for e in sched.entries:
        res.append({
            "course": e.course.name if e.course else "",
            "room": e.room.name if e.room else "",
            "timeslot": f"{e.timeslot.day} {e.timeslot.start_time}-{e.timeslot.end_time}" if e.timeslot else "",
            "instructor": e.instructor.name if e.instructor else "TBA",
            "group": e.group.name if e.group else ""
        })
    return {"schedule": res}
