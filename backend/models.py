from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None


class UserInDB(User):
    hashed_password: str


class CreateUser(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None


class UsernameResponse(BaseModel):
    username: str


class Exercise(BaseModel):
    id: Optional[int] = None
    name: str
    username: Optional[str] = None
    primary_muscles: list[str]
    secondary_muscles: Optional[list[str]] = None
    description: Optional[str] = ""
    # one of these fields must be true to be a valid exercise
    weight: bool = False
    reps: bool = False
    time: bool = False


class Set_Entry(BaseModel):
    weight: Optional[float] = None
    reps: Optional[int] = None
    time: Optional[str] = None # 'HH:MM:SS'


class Exercise_Entry(BaseModel):
    exercise_id: int
    exercise_name: Optional[str] = None
    description: Optional[str] = ""
    set_entries: list[Set_Entry]


class Workout_Stats(BaseModel):
    exercise_count: Optional[int] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    volume: Optional[float] = None # lbs
    distributions: Optional[dict] = None


class Workout(BaseModel):
    id: Optional[int] = None
    name: str
    username: Optional[str] = None
    description: Optional[str] = ""
    date: int # 'YYYYMMDD'
    start_time: str # 'HH:MM:SS' time of day when workout started
    duration: str # 'HH:MM:SS', duration of workout
    stats: Optional[Workout_Stats] = None
    exercise_entries: list[Exercise_Entry]


class Set_Template(BaseModel):
    reps: Optional[int] = None
    rep_range_start: Optional[int] = None
    rep_range_end: Optional[int] = None
    time_range_start: Optional[str] = None # 'HH:MM:SS'
    time_range_end: Optional[str] = None # 'HH:MM:SS'

class Exercise_Template(BaseModel):
    exercise_id: int
    exercise_name: Optional[str] = None
    routine_note: Optional[str] = ""
    set_templates: list[Set_Template]


class Workout_Template(BaseModel):
    id: Optional[int] = None
    name: str
    username: Optional[str] = None
    exercise_templates: list[Exercise_Template]