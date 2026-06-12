from pydantic import BaseModel
from typing import List, Optional

class CourseBase(BaseModel):
    name: str
    sessions_per_week: int
    room_type: str
    enrollment_count: int = 0

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

class StudentGroupBase(BaseModel):
    name: str
    size: int

class StudentGroupCreate(StudentGroupBase):
    course_ids: List[int] = []

class StudentGroupResponse(StudentGroupBase):
    id: int
    courses: List[CourseResponse] = []
    class Config:
        orm_mode = True
        from_attributes = True

class InstructorBase(BaseModel):
    name: str

class InstructorCreate(InstructorBase):
    course_ids: List[int] = []
    group_ids: List[int] = []

class InstructorResponse(InstructorBase):
    id: int
    courses: List[CourseResponse] = []
    groups: List[StudentGroupResponse] = []
    class Config:
        orm_mode = True
        from_attributes = True

class RoomBase(BaseModel):
    name: str
    capacity: int
    room_type: str

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

class TimeSlotBase(BaseModel):
    day: str
    start_time: str
    end_time: str

class TimeSlotCreate(TimeSlotBase):
    pass

class TimeSlotResponse(TimeSlotBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

class ScheduleGenerateRequest(BaseModel):
    dsl_text: Optional[str] = ""
    time_limit_seconds: Optional[int] = 30

class ScheduleEntryResponse(BaseModel):
    id: int
    schedule_id: int
    course: CourseResponse
    instructor: InstructorResponse
    room: RoomResponse
    timeslot: TimeSlotResponse
    group: Optional[StudentGroupResponse] = None
    class Config:
        orm_mode = True
        from_attributes = True

class ScheduleResponse(BaseModel):
    id: int
    name: str
    created_at: str
    status: str
    quality_score: int
    entries: List[ScheduleEntryResponse] = []
    class Config:
        orm_mode = True
        from_attributes = True

class DSLParseResponse(BaseModel):
    success: bool
    ast_summary: Optional[str] = None
    error: Optional[str] = None
