from fastapi import APIRouter, HTTPException, Depends, status
from typing import Annotated
from datetime import datetime
from sqlite3 import Connection, Cursor, Row
from backend.models import *
from backend.database.db import get_db
from backend.auth import get_current_active_user
from backend.routers.exercises import get_exercise


router = APIRouter()


def calculate_workout_stats(cursor: Cursor, workout: Workout, current_user: User):
    exercise_count: int = len(workout.exercise_entries)
    sets: int = sum(len(exercise_entry.set_entries) for exercise_entry in workout.exercise_entries)
    reps: int = sum((set_entry.reps if set_entry.reps is not None else 0) for exercise_entry in workout.exercise_entries for set_entry in exercise_entry.set_entries)
    volume: float = sum((set_entry.weight * set_entry.reps if set_entry.weight and set_entry.reps else 0) for exercise_entry in workout.exercise_entries for set_entry in exercise_entry.set_entries)
    
    muscle_set_counts: dict[str, float] = {}
    total_muscle_sets: float = 0.0
    for exercise_entry in workout.exercise_entries:
        exercise: Exercise = get_exercise(cursor, exercise_entry.exercise_id, current_user.username)
        
        for primary_muscle in exercise.primary_muscles:
            if not primary_muscle in muscle_set_counts:
                muscle_set_counts[primary_muscle] = 1.0
            else:
                muscle_set_counts[primary_muscle] += 1.0
            total_muscle_sets += 1.0
        if exercise.secondary_muscles:
            for secondary_muscle in exercise.secondary_muscles:
                if not secondary_muscle in muscle_set_counts:
                    muscle_set_counts[secondary_muscle] = 0.5
                else:
                    muscle_set_counts[secondary_muscle] += 0.5
                total_muscle_sets += 0.5
    muscle_distribution: dict[str, int] = {}
    for muscle,set_count in muscle_set_counts.items():
        percentage: int = (int) (100 * set_count / total_muscle_sets)
        muscle_distribution[muscle] = percentage

    workout.muscle_distribution = muscle_distribution
    workout.exercise_count = exercise_count
    workout.sets = sets
    workout.reps = reps
    workout.volume = volume


def is_valid_timestamp(timestamp: str, format: str):
    try:
        datetime.strptime(timestamp, format)
        return True
    except ValueError:
        return False


def invalid_set_entry(exercise_row: Row, set_entry: Set_Entry):
    weight: bool = exercise_row["weight"]
    reps: bool = exercise_row["reps"]
    time: bool = exercise_row["time"]
    return ((weight and not set_entry.weight) or
            (not weight and set_entry.weight) or
            (reps and not set_entry.reps) or
            (not reps and set_entry.reps) or
            (time and not set_entry.time) or
            (not time and set_entry.time))


@router.post("/workouts/me/", response_model=Workout, status_code=status.HTTP_201_CREATED)
def create_workout(
    workout: Workout, 
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
    ):
    cursor: Cursor = conn.cursor()

    if not is_valid_timestamp(workout.datetime, "%Y-%m-%d %H:%M:%S"):
        raise HTTPException(status_code=400, detail="Incorrectly formatted datetime")
    if not is_valid_timestamp(workout.duration, "%H:%M:%S"):
        raise HTTPException(status_code=400, detail="Incorrectly formatted duration")

    try:
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.execute("INSERT INTO workouts (name, username, dt, duration) VALUES (?, ?, ?, ?)", (workout.name, current_user.username, workout.datetime, workout.duration))
        workout.id = cursor.lastrowid

        for pos,exercise_entry in enumerate(workout.exercise_entries):
            cursor.execute("SELECT * FROM exercises WHERE id = ?", (exercise_entry.exercise_id,))
            exercise_row: Row = cursor.fetchone()
            if not exercise_row:
                raise HTTPException(status_code=400, detail="Invalid exercise(id) submitted")
            cursor.execute("INSERT INTO workout_exercise_entries (workout_id, exercise_id, description, position) VALUES (?, ?, ?, ?)", (workout.id, exercise_entry.exercise_id, workout.description, pos))
            exercise_entry_id: int = cursor.lastrowid

            
            for set_pos,set_entry in enumerate(exercise_entry.set_entries):
                if (invalid_set_entry(exercise_row, set_entry)):
                    raise HTTPException(status_code=400, detail="Invalid set entries")
                if (set_entry.time and not is_valid_timestamp(set_entry.time, "%H:%M:%S")):
                    raise HTTPException(status_code=400, detail="Incorrectly formatted set entry times")
                cursor.execute("INSERT INTO workout_set_entries (exercise_entry_id, weight, reps, t, position) VALUES (?, ?, ?, ?, ?)", (exercise_entry_id, set_entry.weight, set_entry.reps, set_entry.time, set_pos))
        conn.commit()

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Internal Server Error")

    calculate_workout_stats(cursor, workout, current_user)
    return workout