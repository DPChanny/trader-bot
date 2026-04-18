import asyncio
from collections.abc import AsyncGenerator

import aioboto3
import asyncpg
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from ..entities import BaseEntity
from .env import (
    get_db_instance_identifier,
    get_db_name,
    get_db_port,
    get_db_region,
    get_db_user,
)


_DB_CONNECT_MAX_RETRIES = 5
_DB_CONNECT_BASE_DELAY = 1.0


async def _get_db_endpoint() -> str:
    async with aioboto3.Session().client("rds", region_name=get_db_region()) as client:
        response = await client.describe_db_instances(
            DBInstanceIdentifier=get_db_instance_identifier()
        )
        return response["DBInstances"][0]["Endpoint"]["Address"]


async def _async_creator() -> asyncpg.Connection:
    last_exc: Exception | None = None

    for attempt in range(1, _DB_CONNECT_MAX_RETRIES + 1):
        try:
            db_endpoint = await _get_db_endpoint()
            async with aioboto3.Session().client(
                "rds", region_name=get_db_region()
            ) as client:
                db_password = await client.generate_db_auth_token(
                    DBHostname=db_endpoint,
                    Port=int(get_db_port()),
                    DBUsername=get_db_user(),
                    Region=get_db_region(),
                )
            return await asyncpg.connect(
                host=db_endpoint,
                port=int(get_db_port()),
                user=get_db_user(),
                password=db_password,
                database=get_db_name(),
                ssl="require",
            )
        except Exception as exc:
            last_exc = exc
            delay = _DB_CONNECT_BASE_DELAY * (2 ** (attempt - 1))
            if attempt < _DB_CONNECT_MAX_RETRIES:
                await asyncio.sleep(delay)

    raise last_exc


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
