from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Annotated, Optional, List
import sqlite3
from sqlite3 import Connection, Cursor
from backend.models import *
from backend.database.db import get_db
from backend.auth import *


router = APIRouter()


@router.post("/users/token")
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


@router.post("/users/", response_model=UsernameResponse)
def create_user(user: CreateUser, conn: Connection = Depends(get_db)) -> UsernameResponse:
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


@router.get("/users/me", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
    return current_user