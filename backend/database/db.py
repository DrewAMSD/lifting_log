import sqlite3
from typing import Iterator


def get_db_path() -> str:
    return "backend/database/lifting_log.db"


def get_db() -> Iterator[sqlite3.Connection]:
    conn: sqlite3.Connection = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    # conn.execute("PRAGMA busy_timeout = 5000;")
    # conn.execute("PRAGMA journal_mode = WAL;")
    try:
        yield conn
    finally:
        conn.close()