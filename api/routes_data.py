from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from models.database import get_db
from models.entities import Course, Room, Instructor, TimeSlot, StudentGroup
from models.schemas import (CourseCreate, CourseResponse, RoomCreate, RoomResponse,
                            InstructorCreate, InstructorResponse, TimeSlotCreate, TimeSlotResponse,
                            StudentGroupCreate, StudentGroupResponse)
from typing import List

router = APIRouter()


# Note: assignment endpoint removed per UX decision (assignments managed implicitly via groups/instructors)

# Courses
@router.get("/courses", response_model=List[CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()

@router.post("/courses", response_model=CourseResponse)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    db_course = Course(**course.model_dump())
    db.add(db_course)
    try:
        db.commit()
        db.refresh(db_course)
        return db_course
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail='Course already exists')

# Rooms
@router.get("/rooms", response_model=List[RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    return db.query(Room).all()

@router.post("/rooms", response_model=RoomResponse)
def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    db_room = Room(**room.model_dump())
    db.add(db_room)
    try:
        db.commit()
        db.refresh(db_room)
        return db_room
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail='Room already exists')

# Instructors
@router.get("/instructors", response_model=List[InstructorResponse])
def get_instructors(db: Session = Depends(get_db)):
    return db.query(Instructor).all()

@router.post("/instructors", response_model=InstructorResponse)
def create_instructor(instructor: InstructorCreate, db: Session = Depends(get_db)):
    db_instructor = Instructor(name=instructor.name)
    for c_id in instructor.course_ids:
        c = db.query(Course).filter(Course.id == c_id).first()
        if c: db_instructor.courses.append(c)
    for g_id in instructor.group_ids:
        g = db.query(StudentGroup).filter(StudentGroup.id == g_id).first()
        if g: db_instructor.groups.append(g)
    db.add(db_instructor)
    try:
        db.commit()
        db.refresh(db_instructor)
        return db_instructor
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail='Teacher already exists')

@router.put("/instructors/{inst_id}", response_model=InstructorResponse)
def update_instructor(inst_id: int, instructor: InstructorCreate, db: Session = Depends(get_db)):
    db_instructor = db.query(Instructor).filter(Instructor.id == inst_id).first()
    if not db_instructor:
        raise HTTPException(status_code=404, detail='Instructor not found')

    db_instructor.name = instructor.name
    db_instructor.courses = []
    for c_id in instructor.course_ids:
        c = db.query(Course).filter(Course.id == c_id).first()
        if c:
            db_instructor.courses.append(c)
    db_instructor.groups = []
    for g_id in instructor.group_ids:
        g = db.query(StudentGroup).filter(StudentGroup.id == g_id).first()
        if g:
            db_instructor.groups.append(g)

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
    try:
        db.commit()
        db.refresh(db_ts)
        return db_ts
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail='Time slot already exists')

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
    try:
        db.commit()
        db.refresh(db_group)
        return db_group
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail='Semester already exists')

@router.put("/groups/{group_id}", response_model=StudentGroupResponse)
def update_group(group_id: int, group: StudentGroupCreate, db: Session = Depends(get_db)):
    db_group = db.query(StudentGroup).filter(StudentGroup.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail='Group not found')

    db_group.name = group.name
    db_group.size = group.size
    db_group.courses = []
    for c_id in group.course_ids:
        c = db.query(Course).filter(Course.id == c_id).first()
        if c:
            db_group.courses.append(c)

    db.commit()
    db.refresh(db_group)
    return db_group


# Delete endpoints for CRUD
@router.delete('/courses/{course_id}')
def delete_course(course_id: int, db: Session = Depends(get_db)):
    c = db.query(Course).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(status_code=404, detail='Course not found')
    db.delete(c)
    db.commit()
    return {'status': 'deleted'}

@router.delete('/rooms/{room_id}')
def delete_room(room_id: int, db: Session = Depends(get_db)):
    r = db.query(Room).filter(Room.id == room_id).first()
    if not r:
        raise HTTPException(status_code=404, detail='Room not found')
    db.delete(r)
    db.commit()
    return {'status': 'deleted'}

@router.delete('/instructors/{inst_id}')
def delete_instructor(inst_id: int, db: Session = Depends(get_db)):
    i = db.query(Instructor).filter(Instructor.id == inst_id).first()
    if not i:
        raise HTTPException(status_code=404, detail='Instructor not found')
    db.delete(i)
    db.commit()
    return {'status': 'deleted'}

@router.delete('/groups/{group_id}')
def delete_group(group_id: int, db: Session = Depends(get_db)):
    g = db.query(StudentGroup).filter(StudentGroup.id == group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail='Group not found')
    db.delete(g)
    db.commit()
    return {'status': 'deleted'}
