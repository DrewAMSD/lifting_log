from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from sqlmodel import Session, select, delete
from sqlalchemy.orm import selectinload

from backend.database import get_db
from backend.time import is_valid_timestamp
from backend.auth import get_current_active_user
from backend.models import *
from backend.schemas.template import *
from backend.routers.exercises import get_exercise


router = APIRouter()


def validate_set_template(set_template: Set_Template, exercise: Exercise) -> None:
    if set_template.reps or (set_template.rep_range_start and set_template.rep_range_end):
        if not exercise.reps:
            raise HTTPException(status_code=400, detail="Set template has reps/rep range when exercise does not support reps")
        
    if (not set_template.rep_range_start and set_template.rep_range_end) or (set_template.rep_range_start and not set_template.rep_range_end):
        raise HTTPException(status_code=400, detail="Both start and end of rep range must be defined")

    if set_template.reps and set_template.rep_range_start:
        raise HTTPException(status_code=400, detail="Cannot have both reps and rep range")

    if (set_template.time):
        if not exercise.time:
            raise HTTPException(status_code=400, detail="Set template has time when exercise does not support time")
        
        if not (is_valid_timestamp(set_template.time, is_time=True)):
            raise HTTPException(status_code=400, detail="Set template has incorrectly formatted time field")


def validate_workout_template(session: Session, template: Workout_Template_Create) -> None:
    if len(template.name) == 0:
        raise HTTPException(status_code=400, detail="Unnamed template")
    
    if not template.exercise_templates:
        raise HTTPException(status_code=400, detail="Template missing exercises")
    
    for exercise_template in template.exercise_templates:
        exercise: Exercise = get_exercise(session, exercise_template.exercise_id)

        if not exercise_template.set_templates:
            raise HTTPException(status_code=400, detail="Empty or null set templates array")
        
        for set_template in exercise_template.set_templates:
            validate_set_template(set_template, exercise)


def get_new_exercise_templates(session: Session, template_create: Workout_Template_Create, new_template: Workout_Template) -> list[Exercise_Template]:
    new_exercise_templates: list[Exercise_Template] = []

    for exercise_template_create in template_create.exercise_templates:
        exercise: Exercise = get_exercise(session, exercise_template_create.exercise_id)
        if not exercise:
            raise HTTPException(status_code=404, detail="Exercise not found")

        new_exercise_template: Exercise_Template = Exercise_Template(
            **exercise_template_create.model_dump(exclude={"set_templates"}),
            exercise_name=exercise.name,
            workout_template=new_template,
            exercise=exercise
        )
        session.add(new_exercise_template)

        new_set_templates: list[Set_Template] = []
        for set_template_create in exercise_template_create.set_templates:
            new_set_template: Set_Template = Set_Template(
                **set_template_create.model_dump(),
                exercise_template=new_exercise_template
            )
            session.add(new_set_template)

            new_set_templates.append(new_set_template)
        new_exercise_template.set_templates = new_set_templates

        new_exercise_templates.append(new_exercise_template)

    return new_exercise_templates


@router.post("/templates/me/", response_model=Workout_Template_Read, response_model_exclude_none=True)
def create_user_template(
    template_create: Workout_Template_Create,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> Workout_Template_Read:
    old_workout_template: Workout_Template = session.exec(
        select(Workout_Template)
        .where(
            Workout_Template.name == template_create.name,
            Workout_Template.username == current_user.username
        )
    ).first()
    if old_workout_template:
        raise HTTPException(status_code=400, detail="Template name is currently in use")

    validate_workout_template(session, template_create)
    
    try:
        new_template: Workout_Template = Workout_Template(
            **template_create.model_dump(exclude={"exercise_templates"}),
            username=current_user.username
        )
        session.add(new_template)

        new_exercise_templates: list[Exercise_Template] = get_new_exercise_templates(session, template_create, new_template)

        new_template.exercise_templates = new_exercise_templates

        session.commit()
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")
    
    return new_template


@router.get("/templates/me/", response_model=list[Workout_Template_Read], response_model_exclude_none=True)
def get_user_templates(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> list[Workout_Template_Read]:
    workout_templates: list[Workout_Template] = session.exec(
        select(Workout_Template)
        .where(Workout_Template.username == current_user.username)
        .options(
            selectinload(Workout_Template.exercise_templates)
            .selectinload(Exercise_Template.set_templates)
        )
    ).all()

    if not workout_templates:
        workout_templates = []

    return workout_templates


@router.get("/templates/me/{template_id}", response_model=Workout_Template_Read, response_model_exclude_none=True)
def get_user_template(
    template_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> Workout_Template_Read:
    workout_template: Workout_Template = session.exec(
        select(Workout_Template)
        .where(
            Workout_Template.id == template_id,
            Workout_Template.username == current_user.username
        )
    ).first()

    if not workout_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return workout_template


@router.put("/templates/me/{template_id}", response_model=Workout_Template_Read, response_model_exclude_none=True)
def update_user_template(
    template_id: int,
    template_create: Workout_Template_Create,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> Workout_Template_Read:
    template: Workout_Template = session.exec(
        select(Workout_Template)
        .where(
            Workout_Template.id == template_id,
            Workout_Template.username == current_user.username
        )
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    validate_workout_template(session, template_create)

    try:
        template.sqlmodel_update(template_create.model_dump())
        template.exercise_templates.clear()

        session.exec(
            delete(Exercise_Template)
            .where(Exercise_Template.workout_template_id == template.id)
        )

        new_exercise_templates: list[Exercise_Template] = get_new_exercise_templates(session, template_create, template)
        template.exercise_templates = new_exercise_templates

        session.add(template)
        session.commit()
    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")
    
    return template


@router.delete("/templates/me/{template_id}", status_code=204)
def delete_user_template(
    template_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[Session, Depends(get_db)]
) -> None:
    template: Workout_Template = session.exec(
        select(Workout_Template)
        .where(
            Workout_Template.id == template_id,
            Workout_Template.username == current_user.username
        )
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Tempalte not found")
    
    session.delete(template)
    session.commit()