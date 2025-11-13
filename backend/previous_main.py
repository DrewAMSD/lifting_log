@app.post("/users/", status_code=status.HTTP_201_CREATED)
def create_user(user: User, conn: sqlite3.Connection = Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        message = f"User '{user.username}' already exists"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    cursor.execute("""
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
                   """, (user.username, user.email, user.password))
    conn.commit()
    return user

@app.get("/users/", response_model=List[User])
def get_users(conn: sqlite3.Connection = Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    user_rows = cursor.fetchall()
    if user_rows is None:
        message: str = f"Users not found"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)

    users: list[User] = []
    for user_row in user_rows:
        users.append({
            "username": user_row["username"],
            "password_hash": user_row["password_hash"]
        })
    return users

@app.get("/users/{username}", response_model=User)
def get_user(username: str, conn: sqlite3.Connection = Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user_row = cursor.fetchone()
    if user_row is None:
        message: str = f"User '{username}' not found"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)

    return {
            "username": user_row["username"],
            "password_hash": user_row["password_hash"]
        }

@app.delete("/users/{username}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(username: str, conn: sqlite3.Connection = Depends(get_db)):
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    if cursor.fetchone() is None:
        message: str = f"User '{username}' not found"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)

    cursor.execute("DELETE FROM users WHERE username = ?", (username,))
    conn.commit()

@app.get("/users/{username}/exercises", response_model=List[Exercise])
def get_users_exercises(username: str, conn: sqlite3.Connection = Depends(get_db)):
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises WHERE username = ?", (username,))
    exercise_rows = cursor.fetchall()
    if exercise_rows is None:
        message: str = f"Exercises not found"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
    
    exercises: list[Exercise] = []
    for exercise_row in exercise_rows:
        exercises.append(convert_row_to_exercise(cursor, exercise_row))
    return exercises


def convert_row_to_exercise(cursor, exercise_row) -> Exercise:
    exercise_id: int = exercise_row["id"]

    primary_muscles: list[str] = []
    cursor.execute("SELECT muscle_id FROM exercise_primary_muscles WHERE exercise_id = ?", (exercise_id,))
    primary_muscle_rows = cursor.fetchall()
    if primary_muscle_rows is None:
        message = f"Exercise {exercise_row["name"]} has no primary muscle"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
    for primary_muscle_row in primary_muscle_rows:
        muscle_id: int = primary_muscle_row["muscle_id"]
        cursor.execute("SELECT name FROM muscles WHERE id = ?", (muscle_id,))
        muscles_rows = cursor.fetchall()
        for muscles_row in muscles_rows:
            primary_muscles.append(muscles_row["name"])

    secondary_muscles: list[str] = None
    cursor.execute("SELECT muscle_id FROM exercise_secondary_muscles WHERE exercise_id = ?", (exercise_id,))
    secondary_muscle_rows = cursor.fetchall()
    if secondary_muscle_rows is not None:
        secondary_muscles = []
        for secondary_muscle_row in secondary_muscle_rows:
            muscle_id: int = secondary_muscle_row["muscle_id"]
            cursor.execute("SELECT name FROM muscles WHERE id = ?", (muscle_id,))
            muscles_rows = cursor.fetchall()
            for muscles_row in muscles_rows:
                secondary_muscles.append(muscles_row["name"])

    return {
            "name": exercise_row["name"],
            "username": exercise_row["username"],
            "primary_muscles": primary_muscles,
            "secondary_muscles": secondary_muscles,
            "description": exercise_row["description"],
            "weight": exercise_row["weight"],
            "reps": exercise_row["reps"],
            "time": exercise_row["time"]
        }

@app.get("/exercises/", response_model=List[Exercise])
def get_exercises(conn: sqlite3.Connection = Depends(get_db)) -> list[Exercise]:
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises")
    exercise_rows = cursor.fetchall()
    if exercise_rows is None:
        message: str = f"Exercises not found"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
    
    exercises: list[Exercise] = []
    for exercise_row in exercise_rows:
        exercises.append(convert_row_to_exercise(cursor, exercise_row))
    return exercises

@app.get("/exercises/{exercise_name}", response_model=Exercise)
def get_exercise(exercise_name: str, conn: sqlite3.Connection = Depends(get_db)) -> Exercise:
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises WHERE name = ? COLLATE NOCASE", (exercise_name,))
    exercise_row = cursor.fetchone()

    if exercise_row is None:
        message: str = f"Exercise '{exercise_name}' not found"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)

    return convert_row_to_exercise(cursor, exercise_row)

@app.post("/exercises/", status_code=status.HTTP_201_CREATED)
def create_exercise(exercise: Exercise, conn: sqlite3.Connection = Depends(get_db)):
    cursor: sqlite3.Cursor = conn.cursor()

    cursor.execute("SELECT * FROM exercises WHERE name = ? COLLATE NOCASE", (exercise.name,))
    if cursor.fetchone():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exercise already exists")

    cursor.execute("SELECT * FROM users WHERE username = ?", (exercise.username,))
    if cursor.fetchone() is None:
        message = f"User '{exercise.username}' does not exist"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    name: str = exercise.name
    username: str = exercise.username
    primary_muscles: list[str] = exercise.primary_muscles
    secondary_muscles: list[str] = exercise.secondary_muscles
    description: Optional[str] = exercise.description
    weight: bool = exercise.weight
    reps: bool = exercise.reps
    time: bool = exercise.time
    
    cursor.execute("""
        INSERT INTO exercises (name, username, description, weight, reps, time) 
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (name, username, description, weight, reps, time)
    )
    exercise_id: int = cursor.lastrowid

    for muscle in primary_muscles:
        cursor.execute("SELECT * FROM muscles WHERE name = ?", (muscle,))
        muscle_row = cursor.fetchone()
        if muscle_row is None:
            message: str = f"Exercise '{muscle}' not found"
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
        muscle_id: int = muscle_row["id"]
        cursor.execute("""
                       INSERT INTO exercise_primary_muscles (exercise_id, muscle_id)
                       VALUES (?, ?)
                       """, (exercise_id, muscle_id))
    for muscle in secondary_muscles:
        cursor.execute("SELECT * FROM muscles WHERE name = ?", (muscle,))
        muscle_row = cursor.fetchone()
        if muscle_row is None:
            message: str = f"Exercise '{muscle}' not found"
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
        muscle_id: int = muscle_row["id"]
        cursor.execute("""
                       INSERT INTO exercise_secondary_muscles (exercise_id, muscle_id)
                       VALUES (?, ?)
                       """, (exercise_id, muscle_id))

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

@app.get("/muscles/", response_model=List[str])
def get_muscles(conn: sqlite3.Connection = Depends(get_db)):
    cursor: sqlite3.Cursor = conn.cursor()
    cursor.execute("SELECT * FROM muscles")
    rows = cursor.fetchall()
    muscles: list[str] = []
    for row in rows:
        muscles.append(row["name"])
    return muscles