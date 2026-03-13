from fastapi import APIRouter, HTTPException, Depends, status
from typing import Annotated, Optional, List
from sqlmodel import Session, select
from src.auth import get_current_active_user
from src.models import *
from src.database import get_db


router = APIRouter()


def muscle_in_db(session: Session, muscle: str) -> bool:
    return session.exec(
        select(Muscle)
        .where(Muscle.name == muscle)
    ).first() is not None


@router.post("/exercises/me/", response_model=Exercise, status_code=status.HTTP_201_CREATED)
def create_exercise(
    exercise: Exercise, 
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> Exercise:
    exercise_in_db: Exercise = session.exec(
        select(Exercise)
        .where(Exercise.name == exercise.name and Exercise.username == current_user.username)
    ).first()
    if exercise_in_db:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exercise already exists")
    
    for primary_muscle in exercise.primary_muscles:
        if not muscle_in_db(session, primary_muscle):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Muscle '{primary_muscle}' does not exist")
    if exercise.secondary_muscles is not None:
        for secondary_muscle in exercise.secondary_muscles:
            if not muscle_in_db(session, secondary_muscle):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Muscle '{secondary_muscle}' does not exist")
    
    exercise.username = current_user.username
    session.add(exercise)
    session.commit()
    session.refresh(exercise)

    return exercise


def get_exercises(session: Session, username: str = None) -> list[Exercise]:
    results = None
    if username is None:
        results = session.exec(
            select(Exercise)
            .where(Exercise.username == None)
        )
    else:
        results = session.exec(
            select(Exercise)
            .where((Exercise.username == None) | (Exercise.username == username))
        )
    exercises: list[Exercise] = results.all()
    if not exercises:
        raise HTTPException(status_code=404, detail="Exercises not found")
    return exercises


@router.get("/exercises/me/", response_model=List[Exercise])
def get_user_exercises(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> list[Exercise]:
    return get_exercises(session, current_user.username)


def get_exercise(session: Session, exercise_id: int, username: str = None, for_workout: bool = False) -> Exercise:
    results = None
    if username is None:
        results = session.exec(
            select(Exercise)
            .where(
                Exercise.id == exercise_id,
                Exercise.username == None
            )
        )
    elif for_workout:
        results = session.exec(
            select(Exercise)
            .where(Exercise.id == exercise_id)
        )
    else:
        results = session.exec(
            select(Exercise)
            .where(
                (Exercise.id == exercise_id) &
                ((Exercise.username == None) | (Exercise.username == username))
            )
            .order_by(Exercise.id)
        )

    exercise: Exercise = results.first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise


@router.get("/exercises/me/{exercise_id}", response_model=Exercise)
def get_user_exercise(
    exercise_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> Exercise:
    return get_exercise(session, exercise_id, current_user.username)


@router.put("/exercises/me/{exercise_id}", response_model=Exercise)
def update_exercise(
    exercise_id: int,
    exercise_to_add: Exercise,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> Exercise:
    exercise: Exercise = get_exercise(session, exercise_id, current_user.username)
    if not exercise:
        raise HTTPException(status_code = 404, detail = f"Exercise '{exercise.name}' not found")
    
    for primary_muscle in exercise.primary_muscles:
        if not muscle_in_db(session, primary_muscle):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Muscle '{primary_muscle}' does not exist")
    if exercise.secondary_muscles is not None:
        for secondary_muscle in exercise.secondary_muscles:
            if not muscle_in_db(session, secondary_muscle):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Muscle '{secondary_muscle}' does not exist")

    exercise.sqlmodel_update(exercise_to_add.model_dump())
    
    session.add(exercise)
    session.commit()
    session.refresh(exercise)

    return exercise


@router.delete("/exercises/me/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: int, 
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> None:
    exercise: Exercise = session.exec(
        select(Exercise)
        .where(
            Exercise.id == exercise_id,
            Exercise.username == current_user.username
        )
    ).first()
    if not exercise:
        raise HTTPException(status_code = 404, detail = f"Exercise not found")
    
    try:
        workout: Workout = session.exec(
            select(Workout)
            .where(Workout.exercise_entries.any(exercise_id=exercise_id))
        ).first()

        if workout:
            exercise.username = "delete"
            session.add(exercise)
        else:
            session.delete(exercise)

        workout_template: Workout_Template = session.exec(
            select(Workout_Template)
            .where(Workout_Template.exercise_templates.any(exercise_id=exercise_id))
        ).first()
        if workout_template:
            for exercise_template in workout_template.exercise_templates:
                if exercise_template.exercise_id == exercise_id:
                    session.delete(exercise_template)
                    workout_template.exercise_templates.remove(exercise_template)

            session.add(workout_template)
    except Exception as e:
        session.rollback()
        print(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
    session.commit()


@router.get("/exercises/defaults", response_model=List[Exercise])
def get_default_exercises(session: Annotated[Session, Depends(get_db)]) -> list[Exercise]:
    return get_exercises(session)


@router.get("/exercises/defaults/{exercise_id}", response_model=Exercise)
def get_default_exercise(exercise_id: int, session: Annotated[Session, Depends(get_db)]) -> Exercise:
    return get_exercise(session, exercise_id)