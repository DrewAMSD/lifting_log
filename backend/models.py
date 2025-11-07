from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    user: str
    password_hash: str

class Exercise(BaseModel):
    name: str
    user: str
    primary_muscles: list[str]
    secondary_muscles: Optional[list[str]] = None
    description: Optional[str] = None
    # one of these fields must be true to be a valid exercise
    weight: bool = False
    reps: bool = False
    time: bool = False