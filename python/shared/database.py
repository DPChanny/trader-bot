from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from .entities.base import Base
from .env import get_db_url


_engine: Engine | None = None
_session: sessionmaker | None = None


def setup_engine():
    global _engine, _session

    _engine = create_engine(
        get_db_url(),
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
    )

    _session = sessionmaker(bind=_engine, autocommit=False, autoflush=False)

    from . import entities  # noqa: F401

    Base.metadata.create_all(bind=_engine)


def get_db():
    db = _session()
    try:
        yield db
    finally:
        db.close()
