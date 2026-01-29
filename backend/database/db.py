import sqlite3
from datetime import datetime


def get_db_path():
    return "backend/database/lifting_log.db"


def get_db():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()


def is_valid_timestamp(timestamp: str, format: str):
    try:
        datetime.strptime(timestamp, format)
        return True
    except ValueError:
        return False