import sqlite3

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
        user TEXT UNIQUE,
        password_hash TEXT
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

    muscles: list[str] = [
        "chest", 
        "triceps", 
        "biceps", 
        "forearms",
        "abdominals", 
        "shoulders",
        "back",
        "quadriceps",
        "glutes",
        "hamstrings",
        "calves"
        ]
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
        name TEXT NOT NULL UNIQUE,
        user TEXT NOT NULL UNIQUE,
        description TEXT,
        weight BOOLEAN NOT NULL DEFAULT 0,
        reps BOOLEAN NOT NULL DEFAULT 0,
        time BOOLEAN NOT NULL DEFAULT 0
    )
    """)
    conn.commit()
    conn.close()

def create_exercise_muscle_tables():
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    cursor: sqlite3.Cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS exercise_primary_muscles (
        exercise_id INTEGER NOT NULL,
        muscle_id INTEGER NOT NULL,
        FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
        FOREIGN KEY (muscle_id) REFERENCES muscles (id),
        PRIMARY KEY (exercise_id, muscle_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS exercise_secondary_muscles (
        exercise_id INTEGER NOT NULL,
        muscle_id INTEGER NOT NULL,
        FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
        FOREIGN KEY (muscle_id) REFERENCES muscles (id),
        PRIMARY KEY (exercise_id, muscle_id)
    )
    """)

    conn.commit()
    conn.close()

def create_from_scratch():
    create_users_table()
    create_muscles_table()
    create_exercises_table()
    create_exercise_muscle_tables()

if __name__ == "__main__":
    create_from_scratch()