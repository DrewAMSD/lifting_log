import sqlite3


def get_db_path():
    return "backend/database/lifting_log.db"


def get_db():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()