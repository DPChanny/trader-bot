import asyncio
from collections.abc import Awaitable, Callable

import redis.asyncio as redis

from shared.utils.env import get_redis_db, get_redis_host, get_redis_port
from shared.utils.error import AppError, UnexpectedErrorCode, handle_app_error


async def listen(
    pubsub: redis.client.PubSub, handler: Callable[[dict], Awaitable[None]]
) -> None:
    while True:
        try:
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                try:
                    await handler(message)
                except Exception as e:
                    app_error = AppError(UnexpectedErrorCode.Internal)
                    app_error.__cause__ = e
                    handle_app_error(app_error)
        except asyncio.CancelledError:
            return
        except Exception as e:
            app_error = AppError(UnexpectedErrorCode.Internal)
            app_error.__cause__ = e
            handle_app_error(app_error)
        await asyncio.sleep(1)


_redis: redis.Redis | None = None
_pubsub: redis.Redis | None = None


async def setup_redis():
    global _redis, _pubsub
    _redis = redis.Redis(
        connection_pool=redis.ConnectionPool(
            host=get_redis_host(),
            port=get_redis_port(),
            db=get_redis_db(),
            decode_responses=True,
            health_check_interval=30,
            max_connections=10,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
    )
    _pubsub = redis.Redis(
        connection_pool=redis.ConnectionPool(
            host=get_redis_host(),
            port=get_redis_port(),
            db=get_redis_db(),
            decode_responses=True,
            health_check_interval=30,
            max_connections=10,
            socket_connect_timeout=5,
        )
    )
    await _redis.ping()


def get_redis() -> redis.Redis:
    return _redis


def get_pubsub() -> redis.client.PubSub:
    return _pubsub.pubsub()


async def cleanup_redis():
    global _redis, _pubsub
    if _redis:
        await _redis.close()
        _redis = None
    if _pubsub:
        await _pubsub.close()
        _pubsub = None
