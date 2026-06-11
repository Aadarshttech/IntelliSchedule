from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db
from models.entities import Course, Room, Instructor, TimeSlot, StudentGroup
from models.schemas import (CourseCreate, CourseResponse, RoomCreate, RoomResponse,
                            InstructorCreate, InstructorResponse, TimeSlotCreate, TimeSlotResponse,
                            StudentGroupCreate, StudentGroupResponse)
from typing import List

router = APIRouter()

# Courses
@router.get("/courses", response_model=List[CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()

@router.post("/courses", response_model=CourseResponse)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    db_course = Course(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

# Rooms
@router.get("/rooms", response_model=List[RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    return db.query(Room).all()

@router.post("/rooms", response_model=RoomResponse)
def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    db_room = Room(**room.model_dump())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

# Instructors
@router.get("/instructors", response_model=List[InstructorResponse])
def get_instructors(db: Session = Depends(get_db)):
    return db.query(Instructor).all()

@router.post("/instructors", response_model=InstructorResponse)
def create_instructor(instructor: InstructorCreate, db: Session = Depends(get_db)):
    db_instructor = Instructor(name=instructor.name, department=instructor.department, max_weekly_hours=instructor.max_weekly_hours)
    for c_id in instructor.course_ids:
        c = db.query(Course).filter(Course.id == c_id).first()
        if c: db_instructor.courses.append(c)
    db.add(db_instructor)
    db.commit()
    db.refresh(db_instructor)
    return db_instructor

# TimeSlots
@router.get("/timeslots", response_model=List[TimeSlotResponse])
def get_timeslots(db: Session = Depends(get_db)):
    return db.query(TimeSlot).all()

@router.post("/timeslots", response_model=TimeSlotResponse)
def create_timeslot(ts: TimeSlotCreate, db: Session = Depends(get_db)):
    db_ts = TimeSlot(**ts.model_dump())
    db.add(db_ts)
    db.commit()
    db.refresh(db_ts)
    return db_ts

# StudentGroups
@router.get("/groups", response_model=List[StudentGroupResponse])
def get_groups(db: Session = Depends(get_db)):
    return db.query(StudentGroup).all()

@router.post("/groups", response_model=StudentGroupResponse)
def create_group(group: StudentGroupCreate, db: Session = Depends(get_db)):
    db_group = StudentGroup(name=group.name, size=group.size)
    for c_id in group.course_ids:
        c = db.query(Course).filter(Course.id == c_id).first()
        if c: db_group.courses.append(c)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group
