from pydantic import BaseModel

class Exercise(BaseModel):
    name: str
    default: bool = False # differentiate between default and user created exercises
    primary: list[str]
    secondary: list[str]
    description: str | None = None
    # one of these fields must be true to be a valid exercise
    weight: bool = False
    reps: bool = False
    time: bool = False