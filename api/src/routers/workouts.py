from fastapi import APIRouter, HTTPException, Depends, status
from typing import Annotated
from sqlmodel import Session, select, delete
import datetime
from sqlalchemy.orm import selectinload

from src.models import *
from src.schemas.workout import *
from src.time import *
from src.database import get_db
from src.auth import get_current_active_user
from src.routers.exercises import get_exercise


router = APIRouter()


def get_distributions(session: Session, workouts: list[Workout], username: str = None) -> dict:
    set_distribution: dict[str, dict[str, float]] = {}
    total_muscle_sets: float = 0.0
    for workout in workouts:
        for exercise_entry in workout.exercise_entries:
            for_workout: bool = True
            exercise: Exercise = get_exercise(session, exercise_entry.exercise_id, username, for_workout)
            
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


def get_stats(session: Session, workouts: list[Workout], username: str = None) -> Workout_Stats:
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
    distributions: dict = get_distributions(session, workouts, username)

    return Workout_Stats(
        exercise_count=exercise_count,
        sets=sets,
        reps=reps,
        volume=volume,
        distributions=distributions
    )


def get_workout_stats(session: Session, workout: Workout, username: str = None) -> Workout_Stats:
    return get_stats(session, [workout], username)


def invalid_set_entry(exercise: Exercise, set_entry: Set_Entry) -> bool:
    return not (
        (exercise.weight != set_entry.weight) or
        (exercise.reps != set_entry.reps) or
        (exercise.time != set_entry.time)
    )


def validate_workout(session: Session, workout: Workout) -> None:
    # workout
    if not is_valid_timestamp(workout.date, is_date=True):
        raise HTTPException(status_code=400, detail="Incorrectly formatted date")
    if not is_valid_timestamp(workout.start_time, is_time=True):
        raise HTTPException(status_code=400, detail="Incorrectly formatted start_time")
    if not is_valid_timestamp(workout.duration, is_time=True):
        raise HTTPException(status_code=400, detail="Incorrectly formatted duration")

    if not workout.name:
        raise HTTPException(status_code=400, detail="Workout is unnamed")

    # exercise entries
    if len(workout.exercise_entries) == 0:
        raise HTTPException(status_code=400, detail="Empty exercise entries array")
    
    for pos,exercise_entry in enumerate(workout.exercise_entries):
        exercise: Exercise = session.exec(
            select(Exercise)
            .where(Exercise.id == exercise_entry.exercise_id)
        ).first()
        if not exercise:
            raise HTTPException(status_code=400, detail="Invalid exercise(id) submitted")

        # set entries
        if len(exercise_entry.set_entries) == 0:
            raise HTTPException(status_code=400, detail="Empty set entries array")
        
        for set_pos,set_entry in enumerate(exercise_entry.set_entries):
            if (invalid_set_entry(exercise, set_entry)):
                raise HTTPException(status_code=400, detail="Invalid set entries")
            if (set_entry.time and not is_valid_timestamp(set_entry.time, is_time=True)):
                raise HTTPException(status_code=400, detail="Incorrectly formatted set entry times")


def get_new_exercise_entries(session: Session, workout_create: Workout_Create, new_workout: Workout) -> list[Exercise_Entry]:
    new_exercise_entries: list[Exercise_Entry] = []
    for exercise_entry_create in workout_create.exercise_entries:
        exercise: Exercise = session.get(Exercise, exercise_entry_create.exercise_id)
        if not exercise:
            raise HTTPException(status_code=404, detail="Exercise not found")

        new_exercise_entry: Exercise_Entry = Exercise_Entry(
            **exercise_entry_create.model_dump(exclude={"set_entries"}),
            exercise_name=exercise.name,
            workout=new_workout,
            exercise=exercise
        )
        session.add(new_exercise_entry)

        new_set_entries: list[Set_Entry] = []
        for set_entry_create in exercise_entry_create.set_entries:
            new_set_entry: Set_Entry = Set_Entry(
                **set_entry_create.model_dump(), 
                exercise_entry=new_exercise_entry
            )
            session.add(new_set_entry)
            new_set_entries.append(new_set_entry)
        new_exercise_entry.set_entries = new_set_entries

        new_exercise_entries.append(new_exercise_entry)
    return new_exercise_entries


@router.post("/workouts/me/", response_model=Workout_Read, status_code=status.HTTP_201_CREATED, response_model_exclude_none=True)
def create_workout(
    workout: Workout_Create, 
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> Workout_Read:

    validate_workout(session, workout)

    try:
        new_workout: Workout = Workout(
            **workout.model_dump(exclude={"exercise_entries", "username"}),
            username=current_user.username
        )
        session.add(new_workout)

        new_exercises_entries: list[Exercise_Entry] = get_new_exercise_entries(session, workout, new_workout)

        new_workout.exercise_entries = new_exercises_entries

        session.commit()
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        print(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")

    workout_response: Workout = session.exec(
        select(Workout)
        .where(Workout.id == new_workout.id)
        .options(
            selectinload(Workout.exercise_entries)
            .selectinload(Exercise_Entry.set_entries)
        )
    ).first()

    if not workout_response:
        raise HTTPException(status_code=404, detail="Failed to retrieve created workout")

    workout_response.stats = get_workout_stats(session, workout, current_user.username)
    return workout_response


def get_user_workouts_by_date(session: Session, username: str, start_date: int = None, end_date: int = None) -> list[Workout]:
    if start_date:
        if not is_valid_timestamp(start_date, is_date=True):
            raise HTTPException(status_code=400, detail="Invalid start date")
    if end_date:
        if not is_valid_timestamp(end_date, is_date=True):
            raise HTTPException(status_code=400, detail="Invalid end date")
    
    if not start_date and not end_date:
        statement = (
            select(Workout)
            .where(Workout.username == username)
            .options(
                selectinload(Workout.exercise_entries)
                .selectinload(Exercise_Entry.set_entries)
            )
        )
    elif start_date and not end_date:
        statement = (
            select(Workout)
            .where(
                Workout.username == username,
                Workout.date >= start_date
            )
            .options(
                selectinload(Workout.exercise_entries)
                .selectinload(Exercise_Entry.set_entries)
            )
        )
    elif not start_date and end_date:
        statement = (
            select(Workout)
            .where(
                Workout.username == username,
                Workout.date <= end_date
            )
            .options(
                selectinload(Workout.exercise_entries)
                .selectinload(Exercise_Entry.set_entries)
            )
        )
    else:
        statement = (
            select(Workout)
            .where(
                Workout.username == username,
                Workout.date >= start_date,
                Workout.date <= end_date
            )
            .options(
                selectinload(Workout.exercise_entries)
                .selectinload(Exercise_Entry.set_entries)
            )
        )
    
    workouts: list[Workout] = session.exec(statement).all()
    if not workouts:
        return []

    return workouts


@router.get("/workouts/me/", response_model=list[Workout_Read], response_model_exclude_none=True)
def get_user_workouts(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> list[Workout_Read]:
    return get_user_workouts_by_date(session, current_user.username, start_date=None, end_date=None)


@router.get("/workouts/me/{workout_id}", response_model=Workout_Read, response_model_exclude_none=True)
def get_user_workout(
    workout_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> Workout_Read:
    workout: Workout = session.exec (
        select(Workout)
        .where(
            Workout.id == workout_id,
            Workout.username == current_user.username
        )
        .options(
            selectinload(Workout.exercise_entries)
            .selectinload(Exercise_Entry.set_entries)
        )
    ).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    return workout


@router.put("/workouts/me/{workout_id}", response_model=Workout_Read, response_model_exclude_none=True)
def update_user_workout(
    workout_id: int,
    workout_create: Workout_Create,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> Workout_Read:
    workout: Workout = get_user_workout(workout_id=workout_id, current_user=current_user, session=session)

    validate_workout(session, workout_create)

    try:
        workout.sqlmodel_update(workout_create.model_dump())
        workout.exercise_entries.clear()

        session.exec(
            delete(Exercise_Entry)
            .where(Exercise_Entry.workout_id == workout_id)
        )

        new_exercise_entries: list[Exercise_Entry] = get_new_exercise_entries(session, workout_create, workout)
        workout.exercise_entries = new_exercise_entries

        session.add(workout)
        session.commit()
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        print(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")

    workout.stats = get_workout_stats(session, workout, current_user.username)
    return workout


@router.delete("/workouts/me/{workout_id}", status_code=204)
def delete_user_workout(
    workout_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> None:
    workout: Workout = get_user_workout(workout_id=workout_id, current_user=current_user, session=session)
    
    session.delete(workout)
    session.commit()


@router.get("/workouts/me/stats/this-week", response_model=Workout_Stats)
def get_user_stats_this_week(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> Workout_Stats:
    date: datetime.date = datetime.date.today()
    day_of_week: int = get_day_of_the_week(int(date.strftime("%Y%m%d")))
    start_of_week: datetime.date = date - datetime.timedelta(days=day_of_week)
    start_of_week_int: int = int(start_of_week.strftime("%Y%m%d"))

    workouts: list[Workout] = get_user_workouts_by_date(session, current_user.username, start_date=start_of_week_int)

    stats: Workout_Stats = get_stats(session, workouts, current_user.username)
    return stats


@router.get("/workouts/me/stats/this-month", response_model=Workout_Stats)
def get_user_stats_this_month(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> Workout_Stats:
    date: int = get_date_today()
    start_of_month = date - get_day(date) + 1

    workouts: list[Workout] = get_user_workouts_by_date(session, current_user.username, start_date=start_of_month)

    stats: Workout_Stats = get_stats(session, workouts, current_user.username)
    return stats


@router.get("/workouts/me/stats/this-year", response_model=Workout_Stats)
def get_user_stats_this_month(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> Workout_Stats:
    date: int = 20251128
    start_of_year: int = date - create_date(month=get_month(date)-1,day=get_day(date)-1)
    print(start_of_year)

    workouts: list[Workout] = get_user_workouts_by_date(session, current_user.username, start_date=start_of_year)

    stats: Workout_Stats = get_stats(session, workouts, current_user.username)
    return stats