from fastapi import APIRouter, Depends, status
from typing import Annotated
import sqlite3
from sqlite3 import Connection, Cursor
from backend.models import *
from backend.database.db import get_db
from backend.auth import get_current_active_user


router = APIRouter()


def convert_workout_to_workoutInDB(workout: Workout, workout_id: int):
    return WorkoutInDB(
        name=workout.name,
        description=workout.description,
        datetime=workout.datetime,
        duration=workout.duration,
        exercise_count=workout.exercise_count,
        sets=workout.sets,
        reps=workout.reps,
        volume=workout.volume,
        exercise_entries=workout.exercise_entries,
        id=workout_id
    )


@router.post("/workouts/me/", response_model=WorkoutInDB, status_code=status.HTTP_201_CREATED)
def create_workout(
    workout: Workout, 
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
    ):
    id: int = 123456789
    return convert_workout_to_workoutInDB(workout, id)