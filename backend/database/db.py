from fastapi import HTTPException
import sqlite3
from typing import Union
from datetime import datetime


def get_db_path():
    return "backend/database/lifting_log.db"


def get_db():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    # conn.execute("PRAGMA busy_timeout = 5000;")
    # conn.execute("PRAGMA journal_mode = WAL;")
    try:
        yield conn
    finally:
        conn.close()


def is_valid_timestamp(timestamp: Union[int, str], is_date: bool = False, is_time: bool = False):
    if is_date:
        if not isinstance(timestamp, int):
            return False
        if timestamp < 0:
            return False
        
        year: int = int (timestamp / 10000)
        month: int = int((timestamp / 100) % 100)
        day: int = int(timestamp % 100)
        print(f"{year}-{month}-{day}")
        if year < 2000 or year > 10000:
            return False
        if month <= 0 or month > 12:
            return False
        if day <= 0 or day > 31:
            return False
        
    if is_time:
        if not isinstance(timestamp, str):
            return False
        if len(timestamp) != 8:
            return False
        
        for i in range(0, 8, 3):
            if not (timestamp[i].isdigit() and timestamp[i+1].isdigit()):
                return False
            if i < 6 and timestamp[i+2] != ':':
                return False
    
    return True