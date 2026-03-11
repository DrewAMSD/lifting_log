from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select

from backend.models import Muscle
from backend.database.db import get_db


router = APIRouter()


@router.get("/muscles/defaults", response_model=list[str])
def get_muscles(session: Session = Depends(get_db)) -> list[str]:
    muscles: list[Muscle] = session.exec(
        select(Muscle)
    ).all()
    if muscles is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Muscles Found")

    muscles_strings: list[str] = []
    for muscle in muscles:
        muscles_strings.append(muscle.muscle)
    return muscles_strings