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

class CreateUser(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None

class UsernameResponse(BaseModel):
    username: str

class UserInDB(User):
    hashed_password: str

class Exercise(BaseModel):
    name: str
    username: str
    primary_muscles: list[str]
    secondary_muscles: Optional[list[str]] = None
    description: Optional[str] = None
    # one of these fields must be true to be a valid exercise
    weight: bool = False
    reps: bool = False
    time: bool = False