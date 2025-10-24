from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import Optional, List
from models import *
from db import *
import sqlite3

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.0.81:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root_message() -> dict:
    return {"message": "Hello World!"}

@app.get("/favicon.ico")
def root_icon() -> FileResponse:
    return FileResponse("./favicon.ico")

def convert_row_to_exercise(row) -> Exercise:
    return {
            "name": row["name"],
            "primary_muscles": ["chest"],
            "secondary_muscles": None,
            "description": row["description"],
            "weight": row["weight"],
            "reps": row["reps"],
            "time": row["time"]
        }

@app.get("/exercises/", response_model=List[Exercise])
def get_exercises(conn: sqlite3.Connection = Depends(get_db)) -> list[Exercise]:
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises")
    rows = cursor.fetchall()
    exercises: list[Exercise] = []
    for row in rows:
        exercises.append(convert_row_to_exercise(row))
    return exercises

@app.get("/exercises/{exercise_name}", response_model=Exercise)
def get_exercise(exercise_name: str, conn: sqlite3.Connection = Depends(get_db)) -> Exercise:
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises WHERE name = ? COLLATE NOCASE", (exercise_name,))
    row = cursor.fetchone()

    if row is None:
        message: str = f"Exercise '{exercise_name}' not found"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)

    return convert_row_to_exercise(row)

@app.post("/exercises/", status_code=status.HTTP_201_CREATED)
def create_exercise(exercise: Exercise, conn: sqlite3.Connection = Depends(get_db)):
    cursor: sqlite3.Cursor = conn.cursor()

    cursor.execute("SELECT * FROM exercises WHERE name = ? COLLATE NOCASE", (exercise.name,))
    if cursor.fetchone():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exercise already exists")

    name: str = exercise.name
    description: Optional[str] = exercise.description
    weight: bool = exercise.weight
    reps: bool = exercise.reps
    time: bool = exercise.time
    
    cursor.execute("""
        INSERT INTO exercises (name, description, weight, reps, time) 
        VALUES (?, ?, ?, ?, ?)
        """,
        (name, description, weight, reps, time)
    )
    conn.commit()
    return exercise

@app.delete("/exercises/{exercise_name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(exercise_name: str, conn: sqlite3.Connection = Depends(get_db)):
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises WHERE name = ? COLLATE NOCASE", (exercise_name,))
    if cursor.fetchone() is None:
        message: str = f"Exercise '{exercise_name}' not found"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)

    cursor.execute("DELETE FROM exercises WHERE name = ? COLLATE NOCASE", (exercise_name,))
    conn.commit()

