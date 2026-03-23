from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .env import get_db_url


engine: Engine | None = None
SessionLocal: sessionmaker | None = None
Base = declarative_base()


def init_engine():
    global engine, SessionLocal

    engine = create_engine(
        get_db_url(),
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
    )

    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    import entities  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
