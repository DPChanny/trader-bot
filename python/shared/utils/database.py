from collections.abc import AsyncGenerator

import asyncpg
import boto3
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from ..entities import BaseEntity
from .env import get_aws_region, get_db_host, get_db_name, get_db_port, get_db_user


def _get_db_password() -> str:
    client = boto3.client("rds", region_name=get_aws_region())
    return client.generate_db_auth_token(
        DBHostname=get_db_host(),
        Port=int(get_db_port()),
        DBUsername=get_db_user(),
        Region=get_aws_region(),
    )


async def _create_connection() -> asyncpg.Connection:
    return await asyncpg.connect(
        host=get_db_host(),
        port=int(get_db_port()),
        user=get_db_user(),
        password=_get_db_password(),
        database=get_db_name(),
        ssl="require",
    )


_engine = create_async_engine(
    "postgresql+asyncpg://",
    async_creator=_create_connection,
    pool_pre_ping=True,
    pool_recycle=600,
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
