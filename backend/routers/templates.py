from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from sqlite3 import Connection, Cursor, Row
from backend.database.db import get_db, is_valid_timestamp
from backend.auth import get_current_active_user
from backend.models import *
from backend.routers.exercises import get_exercise


router = APIRouter()


def validate_workout_template(cursor: Cursor, template: Workout_Template, username: str):
    cursor.execute("SELECT * FROM template_workouts WHERE name = ? AND username = ?",(template.name, username))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Template name is currently in use")
    
    if len(template.name) == 0:
        raise HTTPException(status_code=400, detail="Unamed template")
    
    if not template.exercise_templates:
        raise HTTPException(status_code=400, detail="Template missing exercises")


def validate_set_template(set_template: Set_Template, exercise_row: Row):
    if set_template.reps or (set_template.rep_range_start and set_template.rep_range_end):
        if not exercise_row["reps"]:
            raise HTTPException(status_code=400, detail="Set template has reps/rep range when exercise does not support reps")
        
    if (set_template.time_range_start and set_template.time_range_end):
        if not exercise_row["time"]:
            raise HTTPException(status_code=400, detail="Set template has time range when exercise does not support time")
        
        if not (is_valid_timestamp(set_template.time_range_start, "%H:%M:%S") or is_valid_timestamp(set_template.time_range_end, "%H:%M:%S")):
            raise HTTPException(status_code=400, detail="Set template has incorrectly formatted time range")


def insert_template_workout(cursor: Cursor, template: Workout_Template, username: str):
    cursor.execute("""
        INSERT INTO template_workouts
        (name, username)
        VALUES (?, ?)
    """, (template.name, username))
    return cursor.lastrowid


def get_exercise_row(cursor: Cursor, exercise_id: int):
    cursor.execute("SELECT * FROM exercises WHERE id = ?",(exercise_id,))
    exercise_row: Row = cursor.fetchone()
    if not exercise_row:
        raise HTTPException(status_code=404, detail=f"Exercise with id {exercise_id} not found")
    return exercise_row


def insert_template_exercise(cursor: Cursor, pos: int, exercise_template: Exercise_Template, template_id: int):
    cursor.execute("""
                INSERT INTO template_exercises
                (workout_template_id, exercise_id, routine_note, position)
                VALUES (?, ?, ?, ?)
            """, (template_id, exercise_template.exercise_id, exercise_template.routine_note, pos))
    return cursor.lastrowid


def insert_template_set(cursor: Cursor, set_pos: int, set_template: Set_Template, exercise_template_id: int):
    cursor.execute("""
        INSERT INTO template_sets
        (exercise_template_id, reps, rep_range_start, rep_range_end, time_range_start, time_range_end, position)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (exercise_template_id, set_template.reps, set_template.rep_range_start, set_template.rep_range_end, set_template.time_range_start, set_template.time_range_end, set_pos))


@router.post("/templates/me/", response_model=Workout_Template, response_model_exclude_none=True)
def create_user_template(
    template: Workout_Template,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
):
    cursor: Cursor = conn.cursor()

    validate_workout_template(cursor, template, current_user.username)
    
    try:
        template.id = insert_template_workout(cursor, template, current_user.username)
        template.username = current_user.username

        for pos,exercise_template in enumerate(template.exercise_templates):
            exercise_row: Row = get_exercise_row(cursor, exercise_template.exercise_id)
            
            exercise_template_id: int = insert_template_exercise(cursor, pos, exercise_template, template.id)
            exercise_template.exercise_name = exercise_row["name"]

            if not exercise_template.set_templates:
                raise HTTPException(status_code=400, detail="Empty or null set templates array")
            
            for set_pos,set_template in enumerate(exercise_template.set_templates):
                validate_set_template(set_template, exercise_row)
                    
                insert_template_set(cursor, set_pos, set_template, exercise_template_id)

        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")
    
    return template


@router.delete("/templates/me/{template_id}", status_code=204)
def delete_user_template(
    template_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
):
    cursor: Cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM template_workouts WHERE id = ? AND username = ?", (template_id, current_user.username))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Workout template not found")
    
    cursor.execute("DELETE FROM template_workouts WHERE id = ?", (template_id,))
    conn.commit()