from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from sqlite3 import Connection, Cursor, Row
from backend.database.db import get_db
from backend.time import is_valid_timestamp
from backend.auth import get_current_active_user
from backend.models import *
from backend.routers.exercises import get_exercise


router = APIRouter()


def validate_workout_template(template: Workout_Template) -> None:
    if len(template.name) == 0:
        raise HTTPException(status_code=400, detail="Unnamed template")
    
    if not template.exercise_templates:
        raise HTTPException(status_code=400, detail="Template missing exercises")


def validate_set_template(set_template: Set_Template, exercise_row: Row) -> None:
    if set_template.reps or (set_template.rep_range_start and set_template.rep_range_end):
        if not exercise_row["reps"]:
            raise HTTPException(status_code=400, detail="Set template has reps/rep range when exercise does not support reps")
        
    if (set_template.time_range_start and set_template.time_range_end):
        if not exercise_row["time"]:
            raise HTTPException(status_code=400, detail="Set template has time range when exercise does not support time")
        
        if not (is_valid_timestamp(set_template.time_range_start, is_time=True) and is_valid_timestamp(set_template.time_range_end, is_time=True)):
            raise HTTPException(status_code=400, detail="Set template has incorrectly formatted time range")


def insert_template_workout(cursor: Cursor, template: Workout_Template, username: str) -> int:
    cursor.execute("""
        INSERT INTO template_workouts
        (name, username)
        VALUES (?, ?)
    """, (template.name, username))
    return cursor.lastrowid


def get_exercise_row(cursor: Cursor, exercise_id: int) -> Row:
    cursor.execute("SELECT * FROM exercises WHERE id = ?",(exercise_id,))
    exercise_row: Row = cursor.fetchone()
    if not exercise_row:
        raise HTTPException(status_code=404, detail=f"Exercise with id {exercise_id} not found")
    return exercise_row


def insert_template_exercise(cursor: Cursor, pos: int, exercise_template: Exercise_Template, template_id: int) -> int:
    cursor.execute("""
                INSERT INTO template_exercises
                (workout_template_id, exercise_id, routine_note, position)
                VALUES (?, ?, ?, ?)
            """, (template_id, exercise_template.exercise_id, exercise_template.routine_note, pos))
    return cursor.lastrowid


def insert_template_set(cursor: Cursor, set_pos: int, set_template: Set_Template, exercise_template_id: int) -> None:
    cursor.execute("""
        INSERT INTO template_sets
        (exercise_template_id, reps, rep_range_start, rep_range_end, time_range_start, time_range_end, position)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (exercise_template_id, set_template.reps, set_template.rep_range_start, set_template.rep_range_end, set_template.time_range_start, set_template.time_range_end, set_pos))


def insert_template_exercises_and_sets(cursor: Cursor, template: Workout_Template) -> None:
    for pos,exercise_template in enumerate(template.exercise_templates):
        exercise_row: Row = get_exercise_row(cursor, exercise_template.exercise_id)
        
        exercise_template_id: int = insert_template_exercise(cursor, pos, exercise_template, template.id)
        exercise_template.exercise_name = exercise_row["name"]

        if not exercise_template.set_templates:
            raise HTTPException(status_code=400, detail="Empty or null set templates array")
        
        for set_pos,set_template in enumerate(exercise_template.set_templates):
            validate_set_template(set_template, exercise_row)
                
            insert_template_set(cursor, set_pos, set_template, exercise_template_id)


@router.post("/templates/me/", response_model=Workout_Template, response_model_exclude_none=True)
def create_user_template(
    template: Workout_Template,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
) -> Workout_Template:
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM template_workouts WHERE name = ? AND username = ?",(template.name, current_user.username))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Template name is currently in use")

    validate_workout_template(template)
    
    try:
        template.id = insert_template_workout(cursor, template, current_user.username)
        template.username = current_user.username

        insert_template_exercises_and_sets(cursor, template)

        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")
    
    return template


def convert_template_sets_row_to_template(template_sets_row: Row) -> Set_Template:
    return Set_Template(
        reps=template_sets_row["reps"],
        rep_range_start=template_sets_row["rep_range_start"],
        rep_range_end=template_sets_row["rep_range_end"],
        time_range_start=template_sets_row["time_range_start"],
        time_range_end=template_sets_row["time_range_end"]
    )


def get_set_templates(cursor: Cursor, template_exerciss_row: Row) -> list[Set_Template]:
    cursor.execute("SELECT * from template_sets WHERE exercise_template_id = ? ORDER BY position ASC", (template_exerciss_row["id"],))
    template_sets_rows: list[Row] = cursor.fetchall()
    if not template_sets_rows:
        raise HTTPException(status_code=404, detail="Template sets not found")
    
    set_templates: list[Set_Template] = []
    for template_sets_row in template_sets_rows:
        set_templates.append(convert_template_sets_row_to_template(template_sets_row))

    return set_templates


def convert_template_exercises_row_to_template(cursor: Cursor, template_exercises_row: Row) -> Exercise_Template:
    exercise_row: Row = get_exercise_row(cursor, template_exercises_row["exercise_id"])
    set_templates: list[Set_Template] = get_set_templates(cursor, template_exercises_row)

    return Exercise_Template(
        exercise_id=template_exercises_row["exercise_id"],
        exercise_name=exercise_row["name"],
        routine_note=template_exercises_row["routine_note"],
        set_templates=set_templates
    )


def get_exercise_templates(cursor: Cursor, template_workouts_row: Row) -> list[Exercise_Template]:
    cursor.execute("SELECT * FROM template_exercises WHERE workout_template_id = ? ORDER BY position ASC", (template_workouts_row["id"],))
    template_exercises_rows: list[Row] = cursor.fetchall()
    if not template_exercises_rows:
        raise HTTPException(status_code=404, detail="Template missing exercises")
    
    exercise_templates: list[Exercise_Template] = []
    for template_exercises_row in template_exercises_rows:
        exercise_templates.append(convert_template_exercises_row_to_template(cursor, template_exercises_row))

    return exercise_templates


def convert_template_workouts_row_to_template(cursor: Cursor, template_workouts_row: Row) -> Workout_Template:
    exercise_templates: list[Exercise_Template] = get_exercise_templates(cursor, template_workouts_row)

    return Workout_Template(
        id=template_workouts_row["id"],
        name=template_workouts_row["name"],
        username=template_workouts_row["username"],
        exercise_templates=exercise_templates
    )


@router.get("/templates/me/", response_model=list[Workout_Template], response_model_exclude_none=True)
def get_user_templates(
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
) -> list[Workout_Template]:
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM template_workouts WHERE username = ?", (current_user.username,))
    template_workouts_rows: list[Row] = cursor.fetchall()

    if not template_workouts_rows:
        raise HTTPException(status_code=404, detail="User has no templates")
    
    templates: list[Workout_Template] = []
    for template_workouts_row in template_workouts_rows:
        templates.append(convert_template_workouts_row_to_template(cursor, template_workouts_row))
    return templates


@router.get("/templates/me/{template_id}", response_model=Workout_Template, response_model_exclude_none=True)
def get_user_template(
    template_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
) -> Workout_Template:
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM template_workouts WHERE id = ? and username = ?", (template_id, current_user.username))
    template_workouts_row: Row = cursor.fetchone()
    if not template_workouts_row:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return convert_template_workouts_row_to_template(cursor, template_workouts_row)


@router.put("/templates/me/{template_id}", response_model=Workout_Template, response_model_exclude_none=True)
def update_user_template(
    template_id: int,
    template: Workout_Template,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
) -> Workout_Template:
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM template_workouts WHERE id = ? AND username = ?", (template_id, current_user.username))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Template not found")
    
    validate_workout_template(template)

    try:
        cursor.execute("""
            UPDATE template_workouts
            SET name = ?
            WHERE id = ? AND username = ?
        """,
        (template.name, template_id, current_user.username))
        template.id = template_id
        template.username = current_user.username

        cursor.execute("DELETE FROM template_exercises WHERE workout_template_id = ?", (template.id,))

        insert_template_exercises_and_sets(cursor, template)

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
) -> None:
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM template_workouts WHERE id = ? AND username = ?", (template_id, current_user.username))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Tempalte not found")
    
    cursor.execute("DELETE FROM template_workouts WHERE id = ? AND username = ?", (template_id, current_user.username))
    conn.commit()