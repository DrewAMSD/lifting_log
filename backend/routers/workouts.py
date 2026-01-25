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
    exercise_count: int = len(workout.exercise_entries)
    sets: int = sum(len(exercise_entry.set_entries) for exercise_entry in workout.exercise_entries)
    reps: int = sum((set_entry.reps if set_entry.reps is not None else 0) for exercise_entry in workout.exercise_entries for set_entry in exercise_entry.set_entries)
    volume: float = sum((set_entry.weight * set_entry.reps if set_entry.weight and set_entry.reps else 0) for exercise_entry in workout.exercise_entries for set_entry in exercise_entry.set_entries)
    workout_id: int = 123456789 # replace with auto generated id from sql table

    workout.exercise_count = exercise_count
    workout.sets = sets
    workout.reps = reps
    workout.volume = volume
    workout.id = workout_id
    return workout