from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Annotated
from sqlmodel import Session, select

from backend.models import *
from backend.database import get_db
from backend.auth import *


router = APIRouter()


@router.post("/users/token")
def login_for_tokens(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[Session, Depends(get_db)]
) -> Token:
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token: str = create_access_token(
        data={
            "sub": user.username,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
    )
    refresh_token_exp: int = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token: str = create_refresh_token(
        data={
            "sub": user.username,
            "exp": refresh_token_exp
        }
    )

    results = session.exec(
        select(RefreshStore)
        .where(RefreshStore.refresh_token == refresh_token)
    )
    refresh_store_entry: RefreshStore = results.first()
    if refresh_store_entry:
        raise HTTPException(status_code=500, detail="Internal server error: identical refresh tokens created")

    new_refresh_store_entry: RefreshStore = RefreshStore(refresh_token=refresh_token, exp=refresh_token_exp, username=user.username)
    session.add(new_refresh_store_entry)
    session.commit()

    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")


@router.post("/users/refresh")
def refresh_access_token(
    refresh_token: RefreshToken,
    session: Annotated[Session, Depends(get_db)]
) -> AccessToken:
    username: str = verify_refresh_token(refresh_token.refresh_token)

    results = session.exec(
        select(RefreshStore)
        .where(RefreshStore.refresh_token == refresh_token.refresh_token)
    )
    if not results.first():
        raise HTTPException(status_code=404, detail="Refresh token not found")

    access_token: str = create_access_token(
        data={"sub": username}
    )

    return AccessToken(access_token=access_token, token_type="bearer")


@router.delete("/users/refresh")
def delete_user_session(
    refresh_token: RefreshToken,
    session: Annotated[Session, Depends(get_db)]
):
    results = session.exec(
        select(RefreshStore)
        .where(RefreshStore.refresh_token == refresh_token.refresh_token)
    )
    refresh_store_entry: RefreshStore = results.first()
    if not refresh_store_entry:
        raise HTTPException(status_code=404, detail="Refresh token not found")
    
    session.delete(refresh_store_entry)
    session.commit()


@router.delete("/users/me/sessions")
def delete_user_sessions(
    session: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    results = session.exec(
        select(RefreshStore)
        .where(RefreshStore.username == current_user.username)
    )
    refresh_store_entry: RefreshStore = results.first()
    
    session.delete(refresh_store_entry)
    session.commit()


@router.post("/users/", response_model=UsernameResponse)
def create_user(
    user: CreateUser, 
    session: Annotated[Session, Depends(get_db)]
) -> UsernameResponse:
    results = session.exec(
        select(UserInDB)
        .where(UserInDB.username == user.username)
    )
    old_user: UserInDB = results.first()
    if old_user:
        message = f"User '{old_user.username}' already exists"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    user_to_add: UserInDB = UserInDB(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=password_hash.hash(user.password)
    )
    session.add(user_to_add)
    session.commit()
    return { "username": user.username }


@router.get("/users/me", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
    return current_user


@router.delete("/users/me", status_code=204)
def delete_user(
    session: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    user: UserInDB = session.exec(
        select(UserInDB)
        .where(UserInDB.username == current_user.username)    
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    session.delete(user)
    session.commit()