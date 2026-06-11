from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from models.database import get_db
from models.schemas import ScheduleGenerateRequest, ScheduleResponse
from models.entities import Schedule, ScheduleEntry, Course, Room, Instructor, TimeSlot, StudentGroup
from solver.engine import TimetableSolver
from dsl.parser import DSLParser
from dsl.transformer import DSLTransformer
import datetime

router = APIRouter()
parser = DSLParser()
transformer = DSLTransformer()

@router.post("/generate", response_model=ScheduleResponse)
def generate_schedule(req: ScheduleGenerateRequest, db: Session = Depends(get_db)):
    courses = [{"id": c.id, "name": c.name, "sessions_per_week": c.sessions_per_week, "students": c.enrollment_count, "room_type": c.room_type} for c in db.query(Course).all()]
    rooms = [{"id": r.id, "name": r.name, "capacity": r.capacity, "room_type": r.room_type} for r in db.query(Room).all()]
    instructors = [{"id": i.id, "name": i.name, "courses": [c.id for c in i.courses]} for i in db.query(Instructor).all()]
    timeslots = [{"id": t.id, "day": t.day, "start_time": t.start_time, "end_time": t.end_time} for t in db.query(TimeSlot).all()]
    groups = [{"id": g.id, "name": g.name, "courses": [c.id for c in g.courses]} for g in db.query(StudentGroup).all()]
    
    constraints = []
    preferences = []
    if req.dsl_text and req.dsl_text.strip():
        try:
            tree = parser.parse(req.dsl_text)
            ast = transformer.transform(tree)
            
            course_map = {c.name: c.id for c in db.query(Course).all()}
            room_map = {r.name: r.id for r in db.query(Room).all()}
            instructor_map = {i.name: i.id for i in db.query(Instructor).all()}
            
            for c in ast.get("constraints", []):
                mapped_c = c.copy()
                if "course" in mapped_c and mapped_c["course"] in course_map:
                    mapped_c["course"] = course_map[mapped_c["course"]]
                if "courses" in mapped_c:
                    mapped_c["courses"] = [course_map.get(x, x) for x in mapped_c["courses"]]
                if "room" in mapped_c and mapped_c["room"] in room_map:
                    mapped_c["room"] = room_map[mapped_c["room"]]
                if "instructor" in mapped_c and mapped_c["instructor"] in instructor_map:
                    mapped_c["instructor"] = instructor_map[mapped_c["instructor"]]
                constraints.append(mapped_c)
                
            for p in ast.get("preferences", []):
                mapped_p = p.copy()
                if "course" in mapped_p and mapped_p["course"] in course_map:
                    mapped_p["course"] = course_map[mapped_p["course"]]
                preferences.append(mapped_p)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"DSL Error: {str(e)}")

    data = {
        "courses": courses,
        "rooms": rooms,
        "instructors": instructors,
        "timeslots": timeslots,
        "groups": groups,
        "constraints": constraints,
        "preferences": preferences
    }
    
    solver = TimetableSolver(data)
    result = solver.solve(time_limit_seconds=req.time_limit_seconds)
    
    if result["status"] == "INFEASIBLE":
        raise HTTPException(status_code=400, detail="Constraints are infeasible.")
        
    new_sched = Schedule(name="Generated Schedule", created_at=str(datetime.datetime.now()), status="SUCCESS", quality_score=100)
    db.add(new_sched)
    db.flush()
    
    for entry in result["schedule"]:
        db_entry = ScheduleEntry(
            schedule_id=new_sched.id,
            course_id=entry["course_id"],
            room_id=entry["room_id"],
            timeslot_id=entry["timeslot_id"],
            instructor_id=entry["instructor_id"]
        )
        db.add(db_entry)
        for g_id in entry.get("group_ids", []):
            group_entry = ScheduleEntry(
                schedule_id=new_sched.id,
                course_id=entry["course_id"],
                room_id=entry["room_id"],
                timeslot_id=entry["timeslot_id"],
                instructor_id=entry["instructor_id"],
                group_id=g_id
            )
            db.add(group_entry)
            
    db.commit()
    db.refresh(new_sched)
    return new_sched

@router.get("/latest", response_model=Optional[ScheduleResponse])
def get_latest_schedule(db: Session = Depends(get_db)):
    sched = db.query(Schedule).order_by(Schedule.id.desc()).first()
    return sched

@router.get("/{id}", response_model=ScheduleResponse)
def get_schedule(id: int, db: Session = Depends(get_db)):
    sched = db.query(Schedule).filter(Schedule.id == id).first()
    if not sched: raise HTTPException(status_code=404)
    return sched
