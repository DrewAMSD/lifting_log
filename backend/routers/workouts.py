from fastapi import APIRouter, Depends, status
from typing import Annotated
import sqlite3
from sqlite3 import Connection, Cursor
from backend.models import *
from backend.database.db import get_db
from backend.auth import get_current_active_user


router = APIRouter()


@router.post("/workouts/me/", response_model=Workout, status_code=status.HTTP_201_CREATED)
def create_workout(
    workout: Workout, 
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
    ):
    workout_id: int = 123456789
    workout.id = workout_id
    return workout