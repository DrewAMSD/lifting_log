from typing import Generator, Annotated
from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy import Engine, event

from src.models import *


sqlite_url: str = "sqlite:///database/database.db"
connect_args: dict = {
    "check_same_thread": False,
}
engine: Engine = create_engine(sqlite_url, connect_args=connect_args)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def init_database() -> None:
    SQLModel.metadata.create_all(engine)

    # default values
    with Session(engine) as session:
        for muscle in MUSCLES:
            new_muscle: Muscle = Muscle(name=muscle)
            session.add(new_muscle)

        for exercise in EXERCISES:
            new_exercise: Exercise = Exercise(
                name=exercise["name"],
                username=None,
                primary_muscles=exercise["primary_muscles"],
                secondary_muscles=exercise["secondary_muscles"],
                description=exercise["description"],
                weight=exercise["weight"],
                reps=exercise["reps"],
                time=exercise["time"]
            )
            session.add(new_exercise)

        session.commit()


MUSCLES: list[str] = [
    "Chest", 
    "Triceps", 
    "Biceps", 
    "Forearms",
    "Abdominals", 
    "Shoulders",
    "Lats",
    "Lower Back",
    "Upper Back",
    "Quadriceps",
    "Glutes",
    "Hamstrings",
    "Calves",
    "Adductors",
    "Abductors",
    "Neck"
    ]

EXERCISES: list[dict] = [
    {
        "name": "Bench Press(Barbell)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "Lie horizontally on a weight training bench. Begin by holding the barbell over your head. One rep is completed by lowering the bar to your chest and then pressing it back upwards back to its original position.",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Bench Press(Dumbbell)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "Lie horizontally on a weight training bench. Begin by holding dumbbells up with straight arms. One rep is completed by lowering dumbbells besides chest while bending elbows and then pressing it back upwards back to its original position.",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Incline Bench Press(Barbell)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Incline Bench Press(Dumbell)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Chest Dips",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "",
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Chest Dips(Weighted)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Chest Dips(Assisted)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Triceps Dips",
        "username": None,
        "primary_muscles": ["Triceps"],
        "secondary_muscles": ["Chest", "Shoulders"],
        "description": "",
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Triceps Dips(Weighted)",
        "username": None,
        "primary_muscles": ["Triceps"],
        "secondary_muscles": ["Chest", "Shoulders"],
        "description": "",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Triceps Dips(Assisted)",
        "username": None,
        "primary_muscles": ["Triceps"],
        "secondary_muscles": ["Chest", "Shoulders"],
        "description": "",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Push Ups",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "",
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Push Ups(Weighted)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Incline Push Ups",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "",
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Decline Push Ups",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "",
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Diamond Push Ups",
        "username": None,
        "primary_muscles": ["Triceps"],
        "secondary_muscles": ["Chest", "Shoulders"],
        "description": "",
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Archer Push Ups",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "",
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "One Arm Push Ups",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "",
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Pike Push Ups",
        "username": None,
        "primary_muscles": ["Shoulders"],
        "secondary_muscles": ["Triceps", "Chest"],
        "description": "",
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Ring Push Ups",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": "",
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Pull Ups",
        "username": None,
        "primary_muscles": ["Lats"],
        "secondary_muscles": ["Biceps", "Forearms", "Upper Back"],
        "description": "Begin by gripping an overhead bar shoulder-width or a little wider and enter into a dead hang. One rep is completed by pulling chin over the bar and returning to initial hang.",
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Pull Ups(Weighted)",
        "username": None,
        "primary_muscles": ["Lats"],
        "secondary_muscles": ["Biceps", "Forearms", "Upper Back"],
        "description": "Begin by gripping an overhead bar shoulder-width or a little wider and enter into a dead hang. One rep is completed by pulling chin over the bar and returning to initial hang.",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Pull Ups(Assisted)",
        "username": None,
        "primary_muscles": ["Lats"],
        "secondary_muscles": ["Biceps", "Forearms", "Upper Back"],
        "description": "Using a resistance band or pull up assistaed station, begin by gripping an overhead bar shoulder-width or a little wider and enter into a dead hang. One rep is completed by pulling chin over the bar and returning to initial hang.",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Chins Ups",
        "username": None,
        "primary_muscles": ["Lats"],
        "secondary_muscles": ["Biceps", "Forearms", "Upper Back"],
        "description": "",
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Chin Ups(Weighted)",
        "username": None,
        "primary_muscles": ["Lats"],
        "secondary_muscles": ["Biceps", "Forearms", "Upper Back"],
        "description": "",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Chin Ups(Assisted)",
        "username": None,
        "primary_muscles": ["Lats"],
        "secondary_muscles": ["Biceps", "Forearms", "Upper Back"],
        "description": "",
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Planks",
        "username": None,
        "primary_muscles": ["Abdominals"],
        "secondary_muscles": [],
        "description": "",
        "weight": False,
        "reps": False,
        "time": True
    }
]

if __name__ == "__main__":
    init_database()
