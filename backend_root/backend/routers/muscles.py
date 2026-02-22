from fastapi import APIRouter, HTTPException, Depends, status
import sqlite3
from sqlite3 import Connection, Cursor
from backend.database.db import *


router = APIRouter()


@router.get("/muscles/defaults", response_model=list[str])
def get_muscles(conn: Connection = Depends(get_db)) -> list[str]:
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM muscles")
    muscles_rows = cursor.fetchall()
    if muscles_rows is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Muscles Found")
    muscles: list[str] = []
    for muscles_row in muscles_rows:
        muscles.append(muscles_row["name"])

    return muscles