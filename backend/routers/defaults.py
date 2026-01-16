from fastapi import APIRouter, HTTPException, Depends, status
from ..models import Exercise
from ..database import *
from .exercises import get_exercises
from typing import List
import sqlite3
from sqlite3 import Connection, Cursor


router = APIRouter()


@router.get("/defaults/muscles", response_model=list[str])
def get_muscles(conn: Connection = Depends(get_db)):
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM muscles")
    muscles_rows = cursor.fetchall()
    muscles: list[str] = []
    for muscles_row in muscles_rows:
        muscles.append(muscles_row["name"])

    return muscles


@router.get("/defaults/exercises", response_model=List[Exercise])
def get_default_exercises(conn: Connection = Depends(get_db)):
    cursor: Cursor = conn.cursor()
    return get_exercises(cursor)


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

#replace this with a json file holding exercises, and then change this to a method returning a parse of the json file
EXERCISES: list[Exercise] = [
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
        "description": None,
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Incline Bench Press(Dumbell)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": None,
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Chest Dips",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": None,
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Chest Dips(Weighted)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": None,
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Chest Dips(Assisted)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": None,
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Triceps Dips",
        "username": None,
        "primary_muscles": ["Triceps"],
        "secondary_muscles": ["Chest", "Shoulders"],
        "description": None,
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Triceps Dips(Weighted)",
        "username": None,
        "primary_muscles": ["Triceps"],
        "secondary_muscles": ["Chest", "Shoulders"],
        "description": None,
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Triceps Dips(Assisted)",
        "username": None,
        "primary_muscles": ["Triceps"],
        "secondary_muscles": ["Chest", "Shoulders"],
        "description": None,
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Push Ups",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": None,
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Push Ups(Weighted)",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": None,
        "weight": True,
        "reps": True,
        "time": False
    },
    {
        "name": "Incline Push Ups",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": None,
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Decline Push Ups",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": None,
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Diamond Push Ups",
        "username": None,
        "primary_muscles": ["Triceps"],
        "secondary_muscles": ["Chest", "Shoulders"],
        "description": None,
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Archer Push Ups",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": None,
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "One Arm Push Ups",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": None,
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Pike Push Ups",
        "username": None,
        "primary_muscles": ["Shoulders"],
        "secondary_muscles": ["Triceps", "Chest"],
        "description": None,
        "weight": False,
        "reps": True,
        "time": False
    },
    {
        "name": "Ring Push Ups",
        "username": None,
        "primary_muscles": ["Chest"],
        "secondary_muscles": ["Triceps", "Shoulders"],
        "description": None,
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
    }
]