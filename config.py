import os

class Config:
    # Use SQLite by default as requested
    DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./data/timetable.db")
    DEBUG = os.environ.get("DEBUG", "True").lower() in ("true", "1")
    # Add other config variables as needed
