import asyncio
import time
from collections.abc import AsyncGenerator
from datetime import timedelta

import aioboto3
import asyncpg
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .env import (
    get_db_host,
    get_db_name,
    get_db_port,
    get_db_region,
    get_db_user,
    get_phase,
)


_DB_CONNECT_MAX_RETRIES = 5
_DB_CONNECT_BASE_DELAY = 1.0
_RDS_CACHE_LIFETIME = timedelta(minutes=14)


class _RDSCache:
    def __init__(self) -> None:
        self.auth_token: str | None = None
        self.auth_token_expires_at = 0.0
        self.auth_token_lock = asyncio.Lock()

    async def get_auth_token(self, db_endpoint: str) -> str:
        now = time.monotonic()
        if self.auth_token and now < self.auth_token_expires_at:
            return self.auth_token

        async with self.auth_token_lock:
            now = time.monotonic()
            if self.auth_token and now < self.auth_token_expires_at:
                return self.auth_token

            async with aioboto3.Session().client(
                "rds", region_name=get_db_region()
            ) as client:
                auth_token = await client.generate_db_auth_token(
                    DBHostname=db_endpoint,
                    Port=int(get_db_port()),
                    DBUsername=get_db_user(),
                    Region=get_db_region(),
                )

            self.auth_token = auth_token
            self.auth_token_expires_at = now + _RDS_CACHE_LIFETIME.total_seconds()
            return auth_token

    def invalidate_auth_token(self) -> None:
        self.auth_token = None
        self.auth_token_expires_at = 0.0


_rds_cache = _RDSCache()


async def _async_creator() -> asyncpg.Connection:
    phase = get_phase()
    host = get_db_host()
    port = int(get_db_port())
    user = get_db_user()
    name = get_db_name()
    last_exception: Exception | None = None

    for attempt in range(1, _DB_CONNECT_MAX_RETRIES + 1):
        try:
            if phase == "dev":
                return await asyncpg.connect(
                    host=host, port=port, user=user, database=name, ssl="disable"
                )

            password = await _rds_cache.get_auth_token(host)
            try:
                return await asyncpg.connect(
                    host=host,
                    port=port,
                    user=user,
                    password=password,
                    database=name,
                    ssl="require",
                )
            except asyncpg.InvalidPasswordError:
                _rds_cache.invalidate_auth_token()
                password = await _rds_cache.get_auth_token(host)
                return await asyncpg.connect(
                    host=host,
                    port=port,
                    user=user,
                    password=password,
                    database=name,
                    ssl="require",
                )
        except Exception as exception:
            last_exception = exception
            delay = _DB_CONNECT_BASE_DELAY * (2 ** (attempt - 1))
            if attempt < _DB_CONNECT_MAX_RETRIES:
                await asyncio.sleep(delay)

    raise last_exception


_engine = create_async_engine(
    "postgresql+asyncpg://",
    async_creator=_async_creator,
    pool_pre_ping=True,
    pool_recycle=600,
    pool_size=10,
    max_overflow=5,
)

_sessionmaker = async_sessionmaker(
    bind=_engine, autoflush=False, expire_on_commit=False
)


async def setup_db():
    async with _engine.connect():
        pass


def get_engine():
    return _engine


async def cleanup_db():
    if _engine:
        await _engine.dispose()


async def get_session() -> AsyncGenerator[AsyncSession]:
    async with _sessionmaker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
