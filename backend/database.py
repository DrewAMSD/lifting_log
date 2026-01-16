import sqlite3
import backend.routers.defaults as defaults
from models import *

def get_db_path():
    return "./data/lifting_log.db"

def get_db():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def create_users_table():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT,
        full_name TEXT,
        disabled BOOLEAN,
        hashed_password TEXT NOT NULL
    )
    """)
    conn.commit()
    conn.close()

def create_muscles_table():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS muscles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    )
    """)

    conn.commit()
    conn.close()

def populate_muscles_table():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()

    muscles: list[str] = defaults.MUSCLES
    for muscle in muscles:
        cursor.execute("INSERT INTO muscles (name) VALUES (?)", (muscle,))

    conn.commit()
    conn.close()

def create_exercises_table():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT,
        description TEXT,
        weight BOOLEAN NOT NULL DEFAULT 0,
        reps BOOLEAN NOT NULL DEFAULT 0,
        time BOOLEAN NOT NULL DEFAULT 0
    )
    """)

    conn.commit()
    conn.close()



def create_exercise_muscles_table():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS exercise_muscles (
        exercise_id INTEGER NOT NULL,
        muscle_id INTEGER NOT NULL,
        is_primary_muscle BOOLEAN NOT NULL,
        FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
        FOREIGN KEY (muscle_id) REFERENCES muscles (id),
        PRIMARY KEY (exercise_id, muscle_id)
    )
    """)

    conn.commit()
    conn.close()


def insert_exercise_muscles_default(cursor: sqlite3.Cursor, muscle: str, exercise_id: int, is_primary_muscle: bool):
    cursor.execute("SELECT * FROM muscles WHERE name = ?", (muscle,))
    row = cursor.fetchone()
    muscle_id: int = row[0]
    cursor.execute("INSERT INTO exercise_muscles (exercise_id, muscle_id, is_primary_muscle) VALUES (?, ?, ?)",
                   (exercise_id, muscle_id, is_primary_muscle))


def populate_exercise_defaults():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()

    exercises: list[Exercise] = defaults.EXERCISES
    for exercise in exercises:
        cursor.execute("INSERT INTO exercises (name, username, description, weight, reps, time) VALUES (?, ?, ?, ?, ?, ?)",
                       (exercise["name"], exercise["username"], exercise["description"], exercise["weight"], exercise["reps"], exercise["time"]))
        exercise_id: int = cursor.lastrowid
        for primary_muscle in exercise["primary_muscles"]:
            insert_exercise_muscles_default(cursor, primary_muscle, exercise_id, True)
        for secondary_muscle in exercise["secondary_muscles"]:
            insert_exercise_muscles_default(cursor, secondary_muscle, exercise_id, False)

    conn.commit()
    conn.close()


def create_tables():
    create_users_table()
    create_muscles_table()
    create_exercises_table()
    create_exercise_muscles_table()
    pass


def populate_default_data():
    populate_muscles_table()
    populate_exercise_defaults()
    pass


if __name__ == "__main__":
    create_tables()
    populate_default_data()