from sqlmodel import SQLModel
from typing import Optional, List


class Set_Template_Create(SQLModel):
    reps: Optional[int] = None
    rep_range_start: Optional[int] = None
    rep_range_end: Optional[int] = None
    time: Optional[str] = None


class Exercise_Template_Create(SQLModel):
    exercise_id: int
    routine_note: Optional[str] = ""
    set_templates: List[Set_Template_Create]


class Workout_Template_Create(SQLModel):
    name: str
    exercise_templates: List[Exercise_Template_Create]


class Set_Template_Read(Set_Template_Create):
    pass


class Exercise_Template_Read(SQLModel):
    exercise_id: int
    exercise_name: str
    routine_note: str
    set_templates: List[Set_Template_Create]


class Workout_Template_Read(SQLModel):
    id: int
    name: str
    username: str
    exercise_templates: List[Exercise_Template_Read]