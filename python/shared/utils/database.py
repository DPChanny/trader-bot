from collections.abc import AsyncGenerator, Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from ..entities import BaseEntity
from .env import get_db_host, get_db_name, get_db_password, get_db_port, get_db_user


_sync_engine: Engine | None = None
_async_engine: AsyncEngine | None = None
_sync_session_maker: sessionmaker | None = None
_async_session_maker: sessionmaker | None = None


def _get_db_url_netloc() -> str:
    user = get_db_user()
    password = get_db_password()
    host = get_db_host()
    port = get_db_port()
    name = get_db_name()
    return f"{user}:{password}@{host}:{port}/{name}"


def _get_sync_db_url() -> str:
    return f"postgresql://{_get_db_url_netloc()}"


def _get_async_db_url() -> str:
    return f"postgresql+asyncpg://{_get_db_url_netloc()}"


def setup_db():
    global _sync_engine, _async_engine, _sync_session_maker, _async_session_maker

    _sync_engine = create_engine(
        _get_sync_db_url(),
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
    )

    _async_engine = create_async_engine(
        _get_async_db_url(),
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
    )

    _sync_session_maker = sessionmaker(
        bind=_sync_engine, autocommit=False, autoflush=False
    )
    _async_session_maker = sessionmaker(
        bind=_async_engine,
        class_=AsyncSession,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )

    with _sync_engine.connect() as conn:
        conn.execute(text("SELECT pg_advisory_lock(8675309)"))
        try:
            for table in BaseEntity.metadata.sorted_tables:
                table_exists = conn.execute(
                    text(
                        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = :name)"
                    ),
                    {"name": table.name},
                ).scalar()
                if not table_exists:
                    conn.execute(text(f'DROP TYPE IF EXISTS "{table.name}"'))
            conn.commit()
            BaseEntity.metadata.create_all(bind=conn, checkfirst=True)
        finally:
            conn.execute(text("SELECT pg_advisory_unlock(8675309)"))
            conn.commit()


def get_sync_db() -> Generator[Session, None, None]:
    db = _sync_session_maker()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    async with _async_session_maker() as db:
        yield db


def get_async_session_factory():
    return _async_session_maker
