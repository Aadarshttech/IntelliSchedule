from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from .database import Base

instructor_course_table = Table(
    'instructor_course',
    Base.metadata,
    Column('instructor_id', Integer, ForeignKey('instructors.id'), primary_key=True),
    Column('course_id', Integer, ForeignKey('courses.id'), primary_key=True)
)

group_course_table = Table(
    'group_course',
    Base.metadata,
    Column('group_id', Integer, ForeignKey('student_groups.id'), primary_key=True),
    Column('course_id', Integer, ForeignKey('courses.id'), primary_key=True)
)

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    sessions_per_week = Column(Integer)
    room_type = Column(String)
    enrollment_count = Column(Integer)

class Instructor(Base):
    __tablename__ = "instructors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    department = Column(String)
    max_weekly_hours = Column(Integer)
    courses = relationship("Course", secondary=instructor_course_table)
    availabilities = relationship("InstructorAvailability", back_populates="instructor", cascade="all, delete-orphan")

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    capacity = Column(Integer)
    room_type = Column(String)

class TimeSlot(Base):
    __tablename__ = "timeslots"
    id = Column(Integer, primary_key=True, index=True)
    day = Column(String)
    start_time = Column(String)
    end_time = Column(String)

class StudentGroup(Base):
    __tablename__ = "student_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    size = Column(Integer)
    courses = relationship("Course", secondary=group_course_table)

class InstructorAvailability(Base):
    __tablename__ = "instructor_availability"
    id = Column(Integer, primary_key=True, index=True)
    instructor_id = Column(Integer, ForeignKey("instructors.id"))
    timeslot_id = Column(Integer, ForeignKey("timeslots.id"))
    is_available = Column(Boolean, default=True)
    instructor = relationship("Instructor", back_populates="availabilities")
    timeslot = relationship("TimeSlot")

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    created_at = Column(String)
    status = Column(String)
    quality_score = Column(Integer)
    entries = relationship("ScheduleEntry", back_populates="schedule", cascade="all, delete-orphan")

class ScheduleEntry(Base):
    __tablename__ = "schedule_entries"
    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    instructor_id = Column(Integer, ForeignKey("instructors.id"))
    room_id = Column(Integer, ForeignKey("rooms.id"))
    timeslot_id = Column(Integer, ForeignKey("timeslots.id"))
    group_id = Column(Integer, ForeignKey("student_groups.id"), nullable=True)
    
    schedule = relationship("Schedule", back_populates="entries")
    course = relationship("Course")
    instructor = relationship("Instructor")
    room = relationship("Room")
    timeslot = relationship("TimeSlot")
    group = relationship("StudentGroup")
