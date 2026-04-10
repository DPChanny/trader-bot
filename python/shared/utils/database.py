from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from ..entities import BaseEntity
from .env import get_db_host, get_db_name, get_db_password, get_db_port, get_db_user


def _get_db_url() -> str:
    user = get_db_user()
    password = get_db_password()
    host = get_db_host()
    port = get_db_port()
    name = get_db_name()
    return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{name}"


_engine = create_async_engine(
    _get_db_url(),
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

_sessionmaker = sessionmaker(
    bind=_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def setup_db():
    async with _engine.connect() as conn:
        await conn.execute(text("SELECT pg_advisory_lock(8675309)"))
        try:
            for table in BaseEntity.metadata.sorted_tables:
                table_exists = (
                    await conn.execute(
                        text(
                            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = :name)"
                        ),
                        {"name": table.name},
                    )
                ).scalar()
                if not table_exists:
                    await conn.execute(text(f'DROP TYPE IF EXISTS "{table.name}"'))
            await conn.commit()
            await conn.run_sync(BaseEntity.metadata.create_all, checkfirst=True)
        finally:
            await conn.execute(text("SELECT pg_advisory_unlock(8675309)"))
            await conn.commit()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with _sessionmaker() as session:
        yield session
