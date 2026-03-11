from typing import Generator, Annotated
from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy import Engine, event

from backend.models import *


sqlite_url: str = "sqlite:///database.db"
connect_args: dict = {
    "check_same_thread": False,
}
engine: Engine = create_engine(sqlite_url, connect_args=connect_args)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def init_database() -> None:
    SQLModel.metadata.create_all(engine)


if __name__ == "__main__":
    init_database()