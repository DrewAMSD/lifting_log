import sqlite3
from sqlite3 import Connection, Cursor, Row
from backend.models import *
from backend.database.db import get_db_path


def create_users_table():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
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
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
    )
    """)

    conn.commit()
    conn.close()


def populate_muscles_table():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()

    muscles: list[str] = MUSCLES
    for muscle in muscles:
        cursor.execute("INSERT INTO muscles (name) VALUES (?)", (muscle,))

    conn.commit()
    conn.close()


def create_exercises_table():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY,
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
        FOREIGN KEY (muscle_id) REFERENCES muscles (id)
    )
    """)

    conn.commit()
    conn.close()


def insert_exercise_muscles_default(cursor: sqlite3.Cursor, muscle: str, exercise_id: int, is_primary_muscle: bool):
    cursor.execute("SELECT * FROM muscles WHERE name = ?", (muscle,))
    muscles_row: sqlite3.Row = cursor.fetchone()
    muscle_id: int = muscles_row[0]
    cursor.execute("INSERT INTO exercise_muscles (exercise_id, muscle_id, is_primary_muscle) VALUES (?, ?, ?)",
                   (exercise_id, muscle_id, is_primary_muscle))


def populate_exercise_defaults():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()

    exercises: list[Exercise] = EXERCISES
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


def create_workout_tables():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL,
        description TEXT NOT NULL,
        workout_date INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        duration TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workout_exercise_entries (
        id INTEGER PRIMARY KEY,
        workout_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        position INTEGER NOT NULL,
        FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workout_set_entries (
        id INTEGER PRIMARY KEY,
        exercise_entry_id INTEGER NOT NULL,
        weight REAL,
        reps INTEGER,
        t TIME,
        position INTEGER NOT NULL,
        FOREIGN KEY (exercise_entry_id) REFERENCES workout_exercise_entries (id) ON DELETE CASCADE
    )
    """)

    conn.commit()
    conn.close()


def create_workout_template_tables():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS template_workouts (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS template_exercises (
        id INTEGER PRIMARY KEY,
        workout_template_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        routine_note TEXT NOT NULL,
        position INTEGER NOT NULL,
        FOREIGN KEY (workout_template_id) REFERENCES template_workouts (id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS template_sets (
        id INTEGER PRIMARY KEY,
        exercise_template_id INTEGER NOT NULL,
        reps INTEGER,
        rep_range_start INTEGER,
        rep_range_end INTEGER,
        time_range_start TIME,
        time_range_end TIME,
        position INTEGER NOT NULL,
        FOREIGN KEY (exercise_template_id) REFERENCES template_exercises (id) ON DELETE CASCADE
    )
    """)

    conn.commit()
    conn.close()


def create_refresh_store_table():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS refresh_store (
        refresh_token TEXT PRIMARY KEY,
        exp INTEGER NOT NULL,
        username TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()


def create_tables():
    create_users_table()
    create_muscles_table()
    create_exercises_table()
    create_exercise_muscles_table()
    create_workout_tables()
    create_workout_template_tables()
    create_refresh_store_table()
    pass


def populate_default_data():
    populate_muscles_table()
    populate_exercise_defaults()
    pass


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
    create_tables()
    populate_default_data()