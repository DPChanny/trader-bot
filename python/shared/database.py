from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from .entities.base import Base
from .env import get_db_url


engine: Engine | None = None
SessionLocal: sessionmaker | None = None


def init_engine():
    global engine, SessionLocal

    engine = create_engine(
        get_db_url(),
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
    )

    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    import shared.entities  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
