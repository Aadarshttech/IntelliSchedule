from fastapi import APIRouter
from .routes_data import router as data_router
from .routes_dsl import router as dsl_router
from .routes_schedule import router as schedule_router
from .routes_export import router as export_router

api_router = APIRouter()
api_router.include_router(data_router, prefix="/data", tags=["data"])
api_router.include_router(dsl_router, prefix="/dsl", tags=["dsl"])
api_router.include_router(schedule_router, prefix="/schedule", tags=["schedule"])
api_router.include_router(export_router, prefix="/export", tags=["export"])
