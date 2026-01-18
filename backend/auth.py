from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated, Optional, List
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import os
import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
import sqlite3
from sqlite3 import Connection, Cursor
from backend.models import *
from backend.database.db import get_db, get_db_path


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY not found. Ensure a .env file with SECRET KEY exists")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


password_hash = PasswordHash.recommended()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/token")


def verify_password(plain_password: str, hashed_password: str):
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str):
    return password_hash.hash(password)


def get_user(username: str):
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    cursor: Cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user_row = cursor.fetchone()
    conn.close()
    if user_row:
        user = UserInDB(
            username=user_row["username"],
            email=user_row["email"],
            full_name=user_row["full_name"],
            disabled=user_row["disabled"],
            hashed_password=user_row["hashed_password"]
        )
        return user
    return None


def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]):
    if current_user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user