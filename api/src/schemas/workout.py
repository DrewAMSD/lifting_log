from sqlmodel import SQLModel
from typing import Optional, List


class Workout_Stats(SQLModel):
    workout_count: Optional[int] = None
    exercise_count: Optional[int] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    volume: Optional[float] = None # lbs
    distributions: Optional[dict] = None


class Set_Entry_Create(SQLModel):
    weight: Optional[float] = None
    reps: Optional[int] = None
    time: Optional[str] = None # 'HH:MM:SS'


class Exercise_Entry_Create(SQLModel):
    exercise_id: int
    description: Optional[str] = ""
    set_entries: List[Set_Entry_Create]


class Workout_Create(SQLModel):
    name: str
    username: Optional[str] = None
    description: Optional[str] = ""
    date: int # 'YYYYMMDD'
    start_time: str # 'HH:MM:SS' time of day when workout started
    duration: str # 'HH:MM:SS', duration of workout
    exercise_entries: List[Exercise_Entry_Create]


class Set_Entry_Read(Set_Entry_Create):
    pass


class Exercise_Entry_Read(SQLModel):
    exercise_id: int
    exercise_name: str
    description: str
    set_entries: List[Set_Entry_Read] = []


class Workout_Read(SQLModel):
    id: int
    name: str
    username: Optional[str]
    description: Optional[str]
    date: int # 'YYYYMMDD'
    start_time: str # 'HH:MM:SS' time of day when workout started
    duration: str # 'HH:MM:SS', duration of workout
    exercise_entries: List[Exercise_Entry_Read] = []
    stats: Optional[Workout_Stats] = None