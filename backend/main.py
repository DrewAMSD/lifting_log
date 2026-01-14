from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta, timezone
import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from typing import Annotated, Optional, List
from models import *
from database import *
import sqlite3
from sqlite3 import Connection, Cursor

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY not found. Ensure a .env file with SECRET KEY exists")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

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

password_hash = PasswordHash.recommended()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_password(plain_password: str, hashed_password: str):
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str):
    return password_hash.hash(password)


def get_user(username: str):
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user_row = cursor.fetchone()
    conn.close()
    if user_row:
        user = UserInDB(
            username=user_row["username"],
            email=user_row["email"],
            full_name=user_row["full_name"],
            disabled=user_row["disabled"],
            hashed_password=user_row["hashed_password"]
        )
        return user
    return None


def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]):
    if current_user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


@app.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
    ) -> Token:
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@app.post("/users/", response_model=UsernameResponse)
def create_user(user: CreateUser, conn: Connection = Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        message = f"User '{user.username}' already exists"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    cursor.execute("""
                INSERT INTO users (username, email, full_name, hashed_password)
                VALUES (?, ?, ?, ?)
                   """, (user.username, user.email, user.full_name, password_hash.hash(user.password)))
    conn.commit()
    return { "username": user.username }


@app.get("/users/me", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
    ):
    return current_user


def muscle_in_db(cursor: Cursor, muscle: str):
    cursor.execute("SELECT * FROM muscles WHERE name = ?", (muscle,))
    return cursor.fetchone() is not None


def insert_exercise_muscles_row(cursor: Cursor, muscle: str, exercise_id: int, is_primary_muscle: bool):
    cursor.execute("SELECT * FROM muscles WHERE name = ?", (muscle,))
    row = cursor.fetchone()
    muscle_id: int = row["id"]
    cursor.execute("INSERT INTO exercise_muscles (exercise_id, muscle_id, is_primary_muscle) VALUES (?, ?, ?)",
                   (exercise_id, muscle_id, is_primary_muscle))


def convert_exercise_to_exerciseInDB(exercise: Exercise, exercise_id: int):
    return ExerciseInDB(
        name=exercise.name,
        username=exercise.username,
        primary_muscles=exercise.primary_muscles,
        secondary_muscles=exercise.secondary_muscles,
        description=exercise.description,
        weight=exercise.weight,
        reps=exercise.reps,
        time=exercise.time,
        id=exercise_id
        )


def insert_into_exercise_muscles(exercise: Exercise, cursor: Cursor, exercise_id: int):
    for primary_muscle in exercise.primary_muscles:
        insert_exercise_muscles_row(cursor, primary_muscle, exercise_id, True)
    if exercise.secondary_muscles is not None:
        for secondary_muscle in exercise.secondary_muscles:
            insert_exercise_muscles_row(cursor, secondary_muscle, exercise_id, False)


@app.post("/users/me/exercises", response_model=ExerciseInDB, status_code=status.HTTP_201_CREATED)
def create_exercise(
    exercise: Exercise, 
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Connection = Depends(get_db)
    ):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises WHERE name = ? and username = ?",(exercise.name, current_user.username))
    if cursor.fetchone():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exercise already exists")
    
    for primary_muscle in exercise.primary_muscles:
        if not muscle_in_db(cursor, primary_muscle):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Muscle '{primary_muscle}' does not exist")
    if exercise.secondary_muscles is not None:
        for secondary_muscle in exercise.secondary_muscles:
            if not muscle_in_db(cursor, secondary_muscle):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Muscle '{secondary_muscle}' does not exist")
            
    cursor.execute("INSERT INTO exercises (name, username, description, weight, reps, time) VALUES (?, ?, ?, ?, ?, ?)",
                   (exercise.name, current_user.username, exercise.description, exercise.weight, exercise.reps, exercise.time))
    exercise_id: int = cursor.lastrowid
    insert_into_exercise_muscles(exercise, cursor, exercise_id)

    conn.commit()
    exerciseInDB: ExerciseInDB = convert_exercise_to_exerciseInDB(exercise, exercise_id)
    return exerciseInDB


def get_exercise_muscles(cursor: Cursor, exercise_id: int, is_primary: bool):
    cursor.execute("SELECT * FROM exercise_muscles WHERE exercise_id = ? AND is_primary_muscle = ?", (exercise_id, is_primary))
    exercise_muscles_rows = cursor.fetchall()
    if not exercise_muscles_rows:
        return None
    muscles: list[str] = []
    for exercise_muscles_row in exercise_muscles_rows:
        cursor.execute("SELECT * FROM muscles where id = ?", (exercise_muscles_row["muscle_id"],))
        muscles_row: sqlite3.Row = cursor.fetchone()
        muscles.append(muscles_row["name"])
    return muscles


def convert_exercises_row_to_exercise(cursor: Cursor, exercises_row: sqlite3.Row):
    exercise_id: int = exercises_row["id"]
    primary_muscles: list[str] = get_exercise_muscles(cursor, exercise_id, True)
    secondary_muscles: list[str] = get_exercise_muscles(cursor, exercise_id, False)

    return {
        "id": exercise_id,
        "name": exercises_row["name"],
        "username": exercises_row["username"],
        "primary_muscles": primary_muscles,
        "secondary_muscles": secondary_muscles,
        "description": exercises_row["description"],
        "weight": exercises_row["weight"],
        "reps": exercises_row["reps"],
        "time": exercises_row["time"]
    }


def get_exercises(cursor: Cursor, username: str = None):
    if username is None:
        cursor.execute("SELECT * FROM exercises WHERE username IS NULL")
    else:
        cursor.execute("SELECT * FROM exercises WHERE username = ?", (username,))
    exercises_rows = cursor.fetchall()
    exercises: list[Exercise] = []
    for exercises_row in exercises_rows:
        exercises.append(convert_exercises_row_to_exercise(cursor, exercises_row))
    return exercises


@app.get("/users/me/exercises", response_model=List[ExerciseInDB])
def get_user_exercises(
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Connection = Depends(get_db)
    ):
    cursor: Cursor = conn.cursor()
    return get_exercises(cursor, current_user.username)


@app.put("/users/me/exercises/{exercise_id}", response_model=ExerciseInDB)
def update_exercise(
    exercise_id: int,
    exercise: Exercise,
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Annotated[Connection, Depends(get_db)]
    ):
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises WHERE id = ? AND username = ?", (exercise_id, current_user.username))
    exercise_row: sqlite3.Row = cursor.fetchone()
    if not exercise_row:
        raise HTTPException(status_code = 404, detail = f"Exercise '{exercise.name}' not found")
    
    for primary_muscle in exercise.primary_muscles:
        if not muscle_in_db(cursor, primary_muscle):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Muscle '{primary_muscle}' does not exist")
    if exercise.secondary_muscles is not None:
        for secondary_muscle in exercise.secondary_muscles:
            if not muscle_in_db(cursor, secondary_muscle):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Muscle '{secondary_muscle}' does not exist")

    cursor.execute("""
                   UPDATE exercises
                   SET name = ?, description = ?, weight = ?, reps = ?, time = ?
                   WHERE id = ?
                   """,
                   (exercise.name, exercise.description, exercise.weight, exercise.reps, exercise.time, exercise_id))
    
    cursor.execute("DELETE FROM exercise_muscles WHERE exercise_id = ?",(exercise_id,))
    insert_into_exercise_muscles(exercise, cursor, exercise_id)

    conn.commit()
    exerciseInDB: ExerciseInDB = convert_exercise_to_exerciseInDB(exercise, exercise_id)
    return exerciseInDB


@app.delete("/users/me/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: int, 
    current_user: Annotated[User, Depends(get_current_active_user)],
    conn: Connection = Depends(get_db)
    ):
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises WHERE id = ? AND username = ?", (exercise_id, current_user.username))
    if not cursor.fetchone():
        raise HTTPException(status_code = 404, detail = f"Exercise not found")
    cursor.execute("DELETE FROM exercises WHERE id = ?", (exercise_id,))
    conn.commit()


@app.get("/defaults/muscles", response_model=list[str])
def get_muscles(conn: Connection = Depends(get_db)):
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM muscles")
    muscles_rows = cursor.fetchall()
    muscles: list[str] = []
    for muscles_row in muscles_rows:
        muscles.append(muscles_row["name"])

    return muscles


@app.get("/defaults/exercises", response_model=List[Exercise])
def get_default_exercises(conn: Connection = Depends(get_db)):
    cursor: Cursor = conn.cursor()
    return get_exercises(cursor)


@app.get("/")
def root_message():
    return {"message": "Hello World!"}


@app.get("/favicon.ico")
def root_icon():
    return FileResponse("./favicon.ico")