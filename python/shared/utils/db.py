import asyncio
import time
from collections.abc import AsyncGenerator
from datetime import timedelta

import aioboto3
import asyncpg
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from ..entities import BaseEntity
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
_RDS_AUTH_TOKEN_CACHE_LIFETIME = timedelta(minutes=14)


class _RDSCache:
    def __init__(self) -> None:
        self.rds_auth_token: str | None = None
        self.rds_auth_token_expires_at = 0.0
        self.rds_auth_token_lock = asyncio.Lock()

    async def get_rds_auth_token(self, db_endpoint: str) -> str:
        now = time.monotonic()
        if self.rds_auth_token and now < self.rds_auth_token_expires_at:
            return self.rds_auth_token

        async with self.rds_auth_token_lock:
            now = time.monotonic()
            if self.rds_auth_token and now < self.rds_auth_token_expires_at:
                return self.rds_auth_token

            async with aioboto3.Session().client(
                "rds", region_name=get_db_region()
            ) as client:
                token = await client.generate_db_auth_token(
                    DBHostname=db_endpoint,
                    Port=int(get_db_port()),
                    DBUsername=get_db_user(),
                    Region=get_db_region(),
                )

            self.rds_auth_token = token
            self.rds_auth_token_expires_at = (
                now + _RDS_AUTH_TOKEN_CACHE_LIFETIME.total_seconds()
            )
            return token

    def invalidate_rds_auth_token(self) -> None:
        self.rds_auth_token = None
        self.rds_auth_token_expires_at = 0.0


_rds_cache = _RDSCache()


async def _async_creator() -> asyncpg.Connection:
    phase = get_phase()
    db_host = get_db_host()
    db_port = int(get_db_port())
    db_user = get_db_user()
    db_name = get_db_name()
    last_exc: Exception | None = None

    for attempt in range(1, _DB_CONNECT_MAX_RETRIES + 1):
        try:
            if phase == "dev":
                return await asyncpg.connect(
                    host=db_host,
                    port=db_port,
                    user=db_user,
                    database=db_name,
                    ssl="disable",
                )

            db_password = await _rds_cache.get_rds_auth_token(db_host)
            try:
                return await asyncpg.connect(
                    host=db_host,
                    port=db_port,
                    user=db_user,
                    password=db_password,
                    database=db_name,
                    ssl="require",
                )
            except asyncpg.InvalidPasswordError:
                _rds_cache.invalidate_rds_auth_token()
                db_password = await _rds_cache.get_rds_auth_token(db_host)
                return await asyncpg.connect(
                    host=db_host,
                    port=db_port,
                    user=db_user,
                    password=db_password,
                    database=db_name,
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
    pool_size=10,
    max_overflow=5,
)

_sessionmaker = async_sessionmaker(
    bind=_engine, autoflush=False, expire_on_commit=False
)


async def setup_db():
    async with _engine.begin() as conn:
        await conn.run_sync(BaseEntity.metadata.create_all, checkfirst=True)


async def get_session() -> AsyncGenerator[AsyncSession]:
    async with _sessionmaker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
