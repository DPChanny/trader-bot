from collections.abc import AsyncGenerator

import aioboto3
import asyncpg
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from ..entities import BaseEntity
from .env import get_aws_region, get_db_host, get_db_name, get_db_port, get_db_user


async def _get_db_password() -> str:
    async with aioboto3.Session().client("rds", region_name=get_aws_region()) as client:
        return await client.generate_db_auth_token(
            DBHostname=get_db_host(),
            Port=int(get_db_port()),
            DBUsername=get_db_user(),
            Region=get_aws_region(),
        )


async def _async_creator() -> asyncpg.Connection:
    db_password = await _get_db_password()
    return await asyncpg.connect(
        host=get_db_host(),
        port=int(get_db_port()),
        user=get_db_user(),
        password=db_password,
        database=get_db_name(),
        ssl="require",
    )


_engine = create_async_engine(
    "postgresql+asyncpg://",
    async_creator=_async_creator,
    pool_pre_ping=True,
    pool_recycle=600,
)

_sessionmaker = async_sessionmaker(
    bind=_engine, autoflush=False, expire_on_commit=False
)


async def setup_db():
    async with _engine.begin() as conn:
        await conn.run_sync(BaseEntity.metadata.create_all, checkfirst=True)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with _sessionmaker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
