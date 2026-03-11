from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship, Column, JSON


class AccessToken(SQLModel):
    access_token: str
    token_type: str


class RefreshToken(SQLModel):
    refresh_token: str
    token_type: str


class RefreshStore(SQLModel, table=True):
    refresh_token: str = Field(primary_key=True)
    exp: int
    username: str


class Token(SQLModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenData(SQLModel):
    username: Optional[str] = Field(default=None)


class User(SQLModel):
    username: str
    email: Optional[str] = Field(default=None)
    full_name: Optional[str] = Field(default=None)
    disabled: Optional[bool] = Field(default=None)


class UserInDB(SQLModel, table=True):
    username: str = Field(primary_key=True)
    email: Optional[str] = Field(default=None)
    full_name: Optional[str] = Field(default=None)
    disabled: Optional[bool] = Field(default=None)
    hashed_password: str


class CreateUser(SQLModel):
    username: str
    password: str
    email: Optional[str] = Field(default=None)
    full_name: Optional[str] = Field(default=None)


class UsernameResponse(SQLModel):
    username: str


class Muscle(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str


class Exercise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    name: str
    username: Optional[str] = Field(default=None)
    primary_muscles: List[str] = Field(sa_column=Column(JSON))
    secondary_muscles: Optional[List[str]] = Field(default=[], sa_column=Column(JSON))
    description: Optional[str] = ""
    # one of these fields must be true to be a valid exercise
    weight: bool = Field(default=False)
    reps: bool = Field(default=False)
    time: bool = Field(default=False)


class Workout_Stats(SQLModel):
    exercise_count: Optional[int] = Field(default=None)
    sets: Optional[int] = Field(default=None)
    reps: Optional[int] = Field(default=None)
    volume: Optional[float] = Field(default=None) # lbs
    distributions: Optional[dict] = Field(default=None)


class Workout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    username: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default="")
    date: int # 'YYYYMMDD'
    start_time: str # 'HH:MM:SS' time of day when workout started
    duration: str # 'HH:MM:SS', duration of workout
    stats: Optional[Workout_Stats] = Field(default=None, sa_column=Column(JSON))
    
    exercise_entries: List["Exercise_Entry"] = Relationship(
        back_populates="workout",
        cascade_delete=True
    )


class Exercise_Entry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workout_id: int = Field(foreign_key="workout.id", ondelete="CASCADE")
    exercise_id: int = Field(foreign_key="exercise.id")

    exercise_name: Optional[str] = Field(default=None) # todo: how to put name in here (maybe replace with Exercise element instead)
    description: Optional[str] = Field(default="")

    workout: Workout = Relationship(back_populates="exercise_entries")
    set_entries: List["Set_Entry"] = Relationship(
        back_populates="exercise_entry",
        cascade_delete=True
    )


class Set_Entry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exercise_entry_id: int = Field(foreign_key="exercise_entry.id", ondelete="CASCADE")

    weight: Optional[float] = Field(default=None)
    reps: Optional[int] = Field(default=None)
    time: Optional[str] = Field(default=None) # 'HH:MM:SS'

    exercise_entry: Exercise_Entry = Relationship(back_populates="set_entries")


class Workout_Template(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    username: Optional[str] = Field(default=None)

    exercise_templates: List["Exercise_Template"] = Relationship(
        back_populates="workout_template",
        cascade_delete=True
    )


class Exercise_Template(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workout_template_id: int = Field(foreign_key="workout_template.id", ondelete="CASCADE")
    exercise_id: int = Field(foreign_key="exercise.id")

    exercise_name: Optional[str] = Field(default=None) # todo: how to put name in here (maybe replace with Exercise element instead)
    routine_note: Optional[str] = Field(default="")

    workout_template: Optional[Workout_Template] = Relationship(back_populates="exercise_templates")
    set_templates: List["Set_Template"] = Relationship(
        back_populates="exercise_template",
        cascade_delete=True
    )


class Set_Template(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    exercise_template_id: int = Field(foreign_key="exercise_template.id", ondelete="CASCADE")

    reps: Optional[int] = Field(default=None)
    rep_range_start: Optional[int] = Field(default=None)
    rep_range_end: Optional[int] = Field(default=None)
    time: Optional[str] = Field(default=None) # 'HH:MM:SS'

    exercise_template: Exercise_Template = Relationship(back_populates="set_templates")