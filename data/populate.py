import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import SessionLocal, Base, engine
from models.entities import Course, Room, Instructor, TimeSlot, StudentGroup

def populate():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    if db.query(Course).first():
        print("Database already populated.")
        return

    # Courses
    c1 = Course(code="CS101", name="Intro to Computer Science", credits=3, sessions_per_week=3, room_type="lecture", enrollment_count=120)
    c2 = Course(code="MATH201", name="Linear Algebra", credits=3, sessions_per_week=2, room_type="lecture", enrollment_count=80)
    
    # Rooms
    r1 = Room(name="MainHall", building="Building A", capacity=200, room_type="lecture")
    r2 = Room(name="Lab_A", building="Building B", capacity=40, room_type="lab")
    
    # Instructors
    i1 = Instructor(name="DrSmith", department="CS", max_weekly_hours=12)
    
    # TimeSlots
    t1 = TimeSlot(day="Monday", start_time="09:00", end_time="10:00")
    t2 = TimeSlot(day="Monday", start_time="10:00", end_time="11:00")
    t3 = TimeSlot(day="Tuesday", start_time="09:00", end_time="10:00")
    t4 = TimeSlot(day="Wednesday", start_time="09:00", end_time="10:00")
    
    # Groups
    g1 = StudentGroup(name="CS_Year1_A", size=45)
    
    db.add_all([c1, c2, r1, r2, i1, t1, t2, t3, t4, g1])
    db.commit()
    
    # Relationships
    i1.courses.extend([c1, c2])
    g1.courses.extend([c1, c2])
    
    db.commit()
    db.close()
    print("Database populated successfully.")

if __name__ == "__main__":
    populate()
