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
    name: str
    username: Optional[str] = None
    primary_muscles: list[str]
    secondary_muscles: Optional[list[str]] = None
    description: Optional[str] = None
    # one of these fields must be true to be a valid exercise
    weight: bool = False
    reps: bool = False
    time: bool = False


class ExerciseInDB(Exercise):
    id: int


class Set_Entry(BaseModel):
    weight: Optional[float] = None
    reps: Optional[int] = None
    time: Optional[str] = None # 'HH:MM:SS'


class Exercise_Entry(BaseModel):
    exercise_id: int
    set_entries: list[Set_Entry]


class Workout(BaseModel):
    name: str
    description: Optional[str] = None
    datetime: str # 'YYYY-MM-DD HH:MM:SS', start of workout time
    duration: str # 'HH:MM:SS', duration of workout
    exercise_count: int
    sets: Optional[int] = None
    reps: Optional[int] = None
    volume: Optional[int] = None # lbs
    exercise_entries: list[Exercise_Entry]


class WorkoutInDB(Workout):
    id: int