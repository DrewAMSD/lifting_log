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


@router.post("/templates/me/", response_model=Workout_Template, response_model_exclude_none=True)
def create_user_template(
    template: Workout_Template,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
):
    cursor: Cursor = conn.cursor()

    validate_workout_template(cursor, template, current_user.username)
    
    try:
        cursor.execute("""
            INSERT INTO template_workouts
            (name, username)
            VALUES (?, ?)
        """, (template.name, current_user.username))
        template.id = cursor.lastrowid
        template.username = current_user.username

        for exercise_template in template.exercise_templates:
            cursor.execute("SELECT * FROM exercises WHERE id = ?",(exercise_template.exercise_id,))
            exercise_row: Row = cursor.fetchone()
            if not exercise_row:
                raise HTTPException(status_code=404, detail=f"Exercise with id {exercise_template.exercise_id} not found")
            
            cursor.execute("""
                INSERT INTO template_exercises
                (exercise_id, routine_note)
                VALUES (?, ?)
            """, (exercise_template.exercise_id, exercise_template.routine_note))
            exercise_template_id: int = cursor.lastrowid
            exercise_template.exercise_name = exercise_row["name"]

            if not exercise_template.set_templates:
                raise HTTPException(status_code=400, detail="Empty or null set templates array")
            
            for set_template in exercise_template.set_templates:
                validate_set_template(set_template, exercise_row)
                    
                cursor.execute("""
                    INSERT INTO template_sets
                    (exercise_template_id, reps, rep_range_start, rep_range_end, time_range_start, time_range_end)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (exercise_template_id, set_template.reps, set_template.rep_range_start, set_template.rep_range_end, set_template.time_range_start, set_template.time_range_end))

        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")
    
    return template