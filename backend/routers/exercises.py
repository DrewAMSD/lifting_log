from fastapi import APIRouter, HTTPException, Depends, status
from typing import Annotated, Optional, List
import sqlite3
from sqlite3 import Connection, Cursor
from backend.auth import get_current_active_user
from backend.models import *
from backend.database.db import get_db


router = APIRouter()


def muscle_in_db(cursor: Cursor, muscle: str):
    cursor.execute("SELECT * FROM muscles WHERE name = ?", (muscle,))
    return cursor.fetchone() is not None


def insert_exercise_muscles_row(cursor: Cursor, muscle: str, exercise_id: int, is_primary_muscle: bool):
    cursor.execute("SELECT * FROM muscles WHERE name = ?", (muscle,))
    row = cursor.fetchone()
    muscle_id: int = row["id"]
    cursor.execute("INSERT INTO exercise_muscles (exercise_id, muscle_id, is_primary_muscle) VALUES (?, ?, ?)",
                   (exercise_id, muscle_id, is_primary_muscle))


def convert_exercise_to_exerciseInDB(exercise: Exercise, exercise_id: int):
    return ExerciseInDB(
        name=exercise.name,
        username=exercise.username,
        primary_muscles=exercise.primary_muscles,
        secondary_muscles=exercise.secondary_muscles,
        description=exercise.description,
        weight=exercise.weight,
        reps=exercise.reps,
        time=exercise.time,
        id=exercise_id
        )


def insert_into_exercise_muscles(exercise: Exercise, cursor: Cursor, exercise_id: int):
    for primary_muscle in exercise.primary_muscles:
        insert_exercise_muscles_row(cursor, primary_muscle, exercise_id, True)
    if exercise.secondary_muscles is not None:
        for secondary_muscle in exercise.secondary_muscles:
            insert_exercise_muscles_row(cursor, secondary_muscle, exercise_id, False)


@router.post("/exercises/me/", response_model=ExerciseInDB, status_code=status.HTTP_201_CREATED)
def create_exercise(
    exercise: Exercise, 
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Connection = Depends(get_db)
    ):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises WHERE name = ? and username = ?",(exercise.name, current_user.username))
    if cursor.fetchone():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exercise already exists")
    
    for primary_muscle in exercise.primary_muscles:
        if not muscle_in_db(cursor, primary_muscle):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Muscle '{primary_muscle}' does not exist")
    if exercise.secondary_muscles is not None:
        for secondary_muscle in exercise.secondary_muscles:
            if not muscle_in_db(cursor, secondary_muscle):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Muscle '{secondary_muscle}' does not exist")
            
    cursor.execute("INSERT INTO exercises (name, username, description, weight, reps, time) VALUES (?, ?, ?, ?, ?, ?)",
                   (exercise.name, current_user.username, exercise.description, exercise.weight, exercise.reps, exercise.time))
    exercise_id: int = cursor.lastrowid
    insert_into_exercise_muscles(exercise, cursor, exercise_id)

    conn.commit()
    exerciseInDB: ExerciseInDB = convert_exercise_to_exerciseInDB(exercise, exercise_id)
    return exerciseInDB


def get_exercise_muscles(cursor: Cursor, exercise_id: int, is_primary: bool):
    cursor.execute("SELECT * FROM exercise_muscles WHERE exercise_id = ? AND is_primary_muscle = ?", (exercise_id, is_primary))
    exercise_muscles_rows = cursor.fetchall()
    if not exercise_muscles_rows:
        return None
    muscles: list[str] = []
    for exercise_muscles_row in exercise_muscles_rows:
        cursor.execute("SELECT * FROM muscles where id = ?", (exercise_muscles_row["muscle_id"],))
        muscles_row: sqlite3.Row = cursor.fetchone()
        muscles.append(muscles_row["name"])
    return muscles


def convert_exercises_row_to_exercise(cursor: Cursor, exercises_row: sqlite3.Row):
    exercise_id: int = exercises_row["id"]
    primary_muscles: list[str] = get_exercise_muscles(cursor, exercise_id, True)
    secondary_muscles: list[str] = get_exercise_muscles(cursor, exercise_id, False)

    return {
        "id": exercise_id,
        "name": exercises_row["name"],
        "username": exercises_row["username"],
        "primary_muscles": primary_muscles,
        "secondary_muscles": secondary_muscles,
        "description": exercises_row["description"],
        "weight": exercises_row["weight"],
        "reps": exercises_row["reps"],
        "time": exercises_row["time"]
    }


def get_exercises(cursor: Cursor, username: str = None):
    if username is None:
        cursor.execute("SELECT * FROM exercises WHERE username IS NULL")
    else:
        cursor.execute("SELECT * FROM exercises WHERE username = ?", (username,))
    exercises_rows = cursor.fetchall()
    exercises: list[Exercise] = []
    for exercises_row in exercises_rows:
        exercises.append(convert_exercises_row_to_exercise(cursor, exercises_row))
    return exercises


@router.get("/exercises/me/", response_model=List[ExerciseInDB])
def get_user_exercises(
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Connection = Depends(get_db)
    ):
    cursor: Cursor = conn.cursor()
    return get_exercises(cursor, current_user.username)


@router.put("/exercises/me/{exercise_id}", response_model=ExerciseInDB)
def update_exercise(
    exercise_id: int,
    exercise: Exercise,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
    ):
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises WHERE id = ? AND username = ?", (exercise_id, current_user.username))
    exercise_row: sqlite3.Row = cursor.fetchone()
    if not exercise_row:
        raise HTTPException(status_code = 404, detail = f"Exercise '{exercise.name}' not found")
    
    for primary_muscle in exercise.primary_muscles:
        if not muscle_in_db(cursor, primary_muscle):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Muscle '{primary_muscle}' does not exist")
    if exercise.secondary_muscles is not None:
        for secondary_muscle in exercise.secondary_muscles:
            if not muscle_in_db(cursor, secondary_muscle):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Muscle '{secondary_muscle}' does not exist")

    cursor.execute("""
                   UPDATE exercises
                   SET name = ?, description = ?, weight = ?, reps = ?, time = ?
                   WHERE id = ?
                   """,
                   (exercise.name, exercise.description, exercise.weight, exercise.reps, exercise.time, exercise_id))
    
    cursor.execute("DELETE FROM exercise_muscles WHERE exercise_id = ?",(exercise_id,))
    insert_into_exercise_muscles(exercise, cursor, exercise_id)

    conn.commit()
    exerciseInDB: ExerciseInDB = convert_exercise_to_exerciseInDB(exercise, exercise_id)
    return exerciseInDB


@router.delete("/exercises/me/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: int, 
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Connection = Depends(get_db)
    ):
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises WHERE id = ? AND username = ?", (exercise_id, current_user.username))
    if not cursor.fetchone():
        raise HTTPException(status_code = 404, detail = f"Exercise not found")
    cursor.execute("DELETE FROM exercises WHERE id = ?", (exercise_id,))
    conn.commit()


@router.get("/exercises/defaults", response_model=List[Exercise])
def get_default_exercises(conn: Connection = Depends(get_db)):
    cursor: Cursor = conn.cursor()
    return get_exercises(cursor)