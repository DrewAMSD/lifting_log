from fastapi import APIRouter, HTTPException, Depends, status
from typing import Annotated
from sqlite3 import Connection, Cursor, Row
import datetime
from backend.models import *
from backend.time import *
from backend.database.db import get_db
from backend.auth import get_current_active_user
from backend.routers.exercises import get_exercise


router = APIRouter()


def get_distributions(cursor: Cursor, workouts: list[Workout], username: str = None) -> dict:
    set_distribution: dict[str, dict[str, float]] = {}
    total_muscle_sets: float = 0.0
    for workout in workouts:
        for exercise_entry in workout.exercise_entries:
            for_workout: bool = True
            exercise: Exercise = get_exercise(cursor, exercise_entry.exercise_id, username, for_workout)
            
            for primary_muscle in exercise.primary_muscles:
                to_add: float = 1.0 * len(exercise_entry.set_entries)
                if not primary_muscle in set_distribution:
                    set_distribution[primary_muscle] = {
                        "primary": to_add,
                        "secondary": 0.0
                    }
                else:
                    set_distribution[primary_muscle]["primary"] += to_add
                total_muscle_sets += to_add
            if exercise.secondary_muscles:
                for secondary_muscle in exercise.secondary_muscles:
                    to_add: float = 0.5 * len(exercise_entry.set_entries)
                    if not secondary_muscle in set_distribution:
                        set_distribution[secondary_muscle] = {
                            "primary": 0.0,
                            "secondary": to_add
                        }
                    else:
                        set_distribution[secondary_muscle]["secondary"] += to_add
                    total_muscle_sets += to_add
    muscle_distribution: dict[str, int] = {}
    for muscle,sets in set_distribution.items():
        percentage: int = (int) (100 * (sets["primary"] + sets["secondary"]) / total_muscle_sets)
        muscle_distribution[muscle] = percentage

    # sort muscle_distribution by percentages
    muscle_distribution = {m: p for m,p in sorted(muscle_distribution.items(), reverse=True, key=lambda entry: entry[1])}
    return {
        "set_distribution": set_distribution,
        "muscle_distribution": muscle_distribution
    }


def get_stats(cursor: Cursor, workouts: list[Workout], username: str = None) -> Workout_Stats:
    exercise_count: int = sum(
        len(workout.exercise_entries) 
        for workout in workouts
    )
    sets: int = sum(
        len(exercise_entry.set_entries) 
        for workout in workouts 
        for exercise_entry in workout.exercise_entries
    )
    reps: int = sum(
        (set_entry.reps if set_entry.reps is not None else 0) 
        for workout in workouts 
        for exercise_entry in workout.exercise_entries 
        for set_entry in exercise_entry.set_entries
    )
    volume: float = sum(
        (set_entry.weight * set_entry.reps if set_entry.weight and set_entry.reps else 0) 
        for workout in workouts 
        for exercise_entry in workout.exercise_entries 
        for set_entry in exercise_entry.set_entries
    )
    distributions: dict = get_distributions(cursor, workouts, username)

    return Workout_Stats(
        exercise_count=exercise_count,
        sets=sets,
        reps=reps,
        volume=volume,
        distributions=distributions
    )


def get_workout_stats(cursor: Cursor, workout: Workout, username: str = None) -> Workout_Stats:
    return get_stats(cursor, [workout], username)


def invalid_set_entry(exercise_row: Row, set_entry: Set_Entry) -> bool:
    weight: bool = exercise_row["weight"]
    reps: bool = exercise_row["reps"]
    time: bool = exercise_row["time"]
    return not (
        (weight != set_entry.weight) or
        (reps != set_entry.reps) or
        (time != set_entry.time)
    )


def insert_workout_exercise_entry(cursor: Cursor, pos: int, exercise_entry: Exercise_Entry, workout_id: int) -> int:
    cursor.execute("""
        INSERT INTO workout_exercise_entries 
        (workout_id, exercise_id, description, position) 
        VALUES (?, ?, ?, ?)
        """, 
        (workout_id, exercise_entry.exercise_id, exercise_entry.description, pos)
    )
    return cursor.lastrowid


def insert_workout_set_entry(cursor: Cursor, set_pos: int, set_entry: Set_Entry, exercise_entry_id: int, exercise_row: Row) -> None:
    if (invalid_set_entry(exercise_row, set_entry)):
        raise HTTPException(status_code=400, detail="Invalid set entries")
    if (set_entry.time and not is_valid_timestamp(set_entry.time, is_time=True)):
        raise HTTPException(status_code=400, detail="Incorrectly formatted set entry times")
    cursor.execute("INSERT INTO workout_set_entries (exercise_entry_id, weight, reps, t, position) VALUES (?, ?, ?, ?, ?)", (exercise_entry_id, set_entry.weight, set_entry.reps, set_entry.time, set_pos))


def validate_workout(workout: Workout) -> None:
    if not is_valid_timestamp(workout.date, is_date=True):
        raise HTTPException(status_code=400, detail="Incorrectly formatted date")
    if not is_valid_timestamp(workout.start_time, is_time=True):
        raise HTTPException(status_code=400, detail="Incorrectly formatted start_time")
    if not is_valid_timestamp(workout.duration, is_time=True):
        raise HTTPException(status_code=400, detail="Incorrectly formatted duration")

    if len(workout.exercise_entries) == 0:
        raise HTTPException(status_code=400, detail="Empty exercise entries array")


def insert_workout_exercise_and_set_entries(cursor: Cursor, workout: Workout) -> None:
    for pos,exercise_entry in enumerate(workout.exercise_entries):
        cursor.execute("SELECT * FROM exercises WHERE id = ?", (exercise_entry.exercise_id,))
        exercise_row: Row = cursor.fetchone()
        if not exercise_row:
            raise HTTPException(status_code=400, detail="Invalid exercise(id) submitted")

        exercise_entry_id: int = insert_workout_exercise_entry(cursor, pos, exercise_entry, workout.id)
        exercise_entry.exercise_name = exercise_row["name"]

        if len(exercise_entry.set_entries) == 0:
            raise HTTPException(status_code=400, detail="Empty set entries array")
        
        for set_pos,set_entry in enumerate(exercise_entry.set_entries):
            insert_workout_set_entry(cursor, set_pos, set_entry, exercise_entry_id, exercise_row)


@router.post("/workouts/me/", response_model=Workout, status_code=status.HTTP_201_CREATED, response_model_exclude_none=True)
def create_workout(
    workout: Workout, 
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
) -> Workout:
    cursor: Cursor = conn.cursor()

    validate_workout(workout)

    try:
        cursor.execute("INSERT INTO workouts (name, username, description, workout_date, start_time, duration) VALUES (?, ?, ?, ?, ?, ?)", (workout.name, current_user.username, workout.description, workout.date, workout.start_time, workout.duration))
        workout.id = cursor.lastrowid

        insert_workout_exercise_and_set_entries(cursor, workout)

        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")

    workout.stats = get_workout_stats(cursor, workout, current_user.username)
    return workout


def get_exercise_entry_set_entries(cursor: Cursor, exercise_entry_id: int) -> list[Set_Entry]:
    cursor.execute("SELECT * FROM workout_set_entries WHERE exercise_entry_id = ? ORDER BY position ASC", (exercise_entry_id,))
    set_entries_rows: list[Row] = cursor.fetchall()
    if not set_entries_rows:
        raise HTTPException(status_code=404, detail="Set entries not found")
    
    set_entries: list[Set_Entry] = []
    for set_entries_row in set_entries_rows:
        set_entries.append(Set_Entry(
            weight=set_entries_row["weight"],
            reps=set_entries_row["reps"],
            time=set_entries_row["t"]
        ))
    return set_entries


def get_exercise_name(cursor: Cursor, exercise_id: int) -> str:
    cursor.execute("SELECT * FROM exercises WHERE id = ?", (exercise_id,))
    exercises_row: Row = cursor.fetchone()
    if not exercises_row:
        raise HTTPException(status_code=404, detail="Exercise in workout not found")
    return exercises_row["name"]

def get_workout_exercise_entries(cursor: Cursor, workout_id: int) -> list[Exercise_Entry]:
    cursor.execute("SELECT * FROM workout_exercise_entries WHERE workout_id = ? ORDER BY position ASC", (workout_id,))
    exercise_entries_rows: list[Row] = cursor.fetchall()
    if not exercise_entries_rows:
        raise HTTPException(status_code=404, detail="Exercise entries not found")

    exercise_entries: list[Exercise_Entry] = []
    for exercise_entries_row in exercise_entries_rows:
        exercise_entries.append(Exercise_Entry(
            exercise_id=exercise_entries_row["exercise_id"],
            exercise_name=get_exercise_name(cursor, exercise_entries_row["exercise_id"]),
            description=exercise_entries_row["description"],
            set_entries=get_exercise_entry_set_entries(cursor, exercise_entries_row["id"])
        ))
    return exercise_entries


def convert_workouts_row_to_workout(cursor: Cursor, workouts_row: Row, username: str) -> Workout:
    exercise_entries: list[Exercise_Entry] = get_workout_exercise_entries(cursor, workouts_row["id"])
    
    workout: Workout = Workout(
        id=workouts_row["id"],
        name=workouts_row["name"],
        username=workouts_row["username"],
        description=workouts_row["description"],
        date=workouts_row["workout_date"],
        start_time=workouts_row["start_time"],
        duration=workouts_row["duration"],
        exercise_entries=exercise_entries
    )
    workout.stats = get_workout_stats(cursor, workout, username)
    return workout


def get_user_workouts_by_date(cursor: Cursor, username: str, start_date: int = None, end_date: int = None) -> list[Workout]:
    if start_date:
        if not is_valid_timestamp(start_date, is_date=True):
            raise HTTPException(status_code=400, detail="Invalid start date")
    if end_date:
        if not is_valid_timestamp(end_date, is_date=True):
            raise HTTPException(status_code=400, detail="Invalid end date")
    
    if not start_date and not end_date:
        cursor.execute("SELECT * FROM workouts WHERE username = ?", (username,))
    elif start_date and not end_date:
        cursor.execute("SELECT * FROM workouts WHERE username = ? AND workout_date >= ?", (username, start_date))
    elif not start_date and end_date:
        cursor.execute("SELECT * FROM workouts WHERE username = ? AND workout_date <= ?", (username, end_date))
    else:
        cursor.execute("SELECT * FROM workouts WHERE username = ? AND workout_date >= ? AND workout_date <= ?", (username, start_date, end_date))
    
    workouts_rows: list[Row] = cursor.fetchall()
    if not workouts_rows:
        return []
    
    workouts: list[Workout] = []
    for workouts_row in workouts_rows:
        workouts.append(convert_workouts_row_to_workout(cursor, workouts_row, username))

    return workouts


@router.get("/workouts/me/", response_model=list[Workout], response_model_exclude_none=True)
def get_user_workouts(
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
) -> list[Workout]:
    cursor: Cursor = conn.cursor()
    return get_user_workouts_by_date(cursor, current_user.username, start_date=None, end_date=None)


@router.get("/workouts/me/{workout_id}", response_model=Workout, response_model_exclude_none=True)
def get_user_workout(
    workout_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
) -> Workout:
    cursor: Cursor = conn.cursor()

    cursor.execute("SELECT * FROM workouts WHERE id = ? AND username = ?", (workout_id, current_user.username))
    workouts_row: Row = cursor.fetchone()
    if not workouts_row:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    return convert_workouts_row_to_workout(cursor, workouts_row, current_user.username)


@router.put("/workouts/me/{workout_id}", response_model=Workout, response_model_exclude_none=True)
def update_user_workout(
    workout_id: int,
    workout: Workout,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
) -> Workout:
    cursor: Cursor = conn.cursor()
    workout.id=workout_id

    cursor.execute("SELECT * FROM workouts WHERE id = ? AND username = ?", (workout_id, current_user.username))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Workout not found")

    if len(workout.exercise_entries) == 0:
        raise HTTPException(status_code=400, detail="Empty exercise entries array")

    try:
        cursor.execute("""
            UPDATE workouts
            SET name = ?, description = ?, workout_date = ?, start_time = ?, duration = ?
            WHERE id = ?
            """,
            (workout.name, workout.description, workout.date, workout.start_time, workout.duration, workout_id)
        )

        cursor.execute("DELETE FROM workout_exercise_entries WHERE workout_id = ?", (workout_id,))

        insert_workout_exercise_and_set_entries(cursor, workout)

        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
    workout.stats = get_workout_stats(cursor, workout, current_user.username)
    return workout


@router.delete("/workouts/me/{workout_id}", status_code=204)
def delete_user_workout(
    workout_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
) -> None:
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM workouts WHERE id = ? AND username = ?", (workout_id, current_user.username))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Workout not found")
    
    cursor.execute("DELETE FROM workouts WHERE id = ?", (workout_id,))
    conn.commit()


@router.get("/workouts/me/stats/this-week", response_model=Workout_Stats)
def get_user_stats_this_week(
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
) -> Workout_Stats:
    cursor: Cursor = conn.cursor()

    date: datetime.date = datetime.date.today()
    day_of_week: int = get_day_of_the_week(int(date.strftime("%Y%m%d")))
    start_of_week: datetime.date = date - datetime.timedelta(days=day_of_week)
    start_of_week_int: int = int(start_of_week.strftime("%Y%m%d"))

    workouts: list[Workout] = get_user_workouts_by_date(cursor, current_user.username, start_date=start_of_week_int)

    stats: Workout_Stats = get_stats(cursor, workouts, current_user.username)
    return stats


@router.get("/workouts/me/stats/this-month", response_model=Workout_Stats)
def get_user_stats_this_month(
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
) -> Workout_Stats:
    cursor: Cursor = conn.cursor()

    date: int = get_date_today()
    start_of_month = date - get_day(date) + 1

    workouts: list[Workout] = get_user_workouts_by_date(cursor, current_user.username, start_date=start_of_month)

    stats: Workout_Stats = get_stats(cursor, workouts, current_user.username)
    return stats


@router.get("/workouts/me/stats/this-year", response_model=Workout_Stats)
def get_user_stats_this_month(
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
) -> Workout_Stats:
    cursor: Cursor = conn.cursor()

    date: int = 20251128
    start_of_year: int = date - create_date(month=get_month(date)-1,day=get_day(date)-1)
    print(start_of_year)

    workouts: list[Workout] = get_user_workouts_by_date(cursor, current_user.username, start_date=start_of_year)

    stats: Workout_Stats = get_stats(cursor, workouts, current_user.username)
    return stats