import redis.asyncio as redis

from shared.utils.env import get_redis_db, get_redis_host, get_redis_port


_redis: redis.Redis | None = None
_pubsub_redis: redis.Redis | None = None


async def setup_redis():
    global _redis, _pubsub_redis
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
    _pubsub_redis = redis.Redis(
        connection_pool=redis.ConnectionPool(
            host=get_redis_host(),
            port=get_redis_port(),
            db=get_redis_db(),
            decode_responses=True,
            health_check_interval=30,
            max_connections=3,
            socket_connect_timeout=5,
        )
    )
    await _redis.ping()


def get_redis() -> redis.Redis:
    return _redis


def get_pubsub_redis() -> redis.Redis:
    return _pubsub_redis


async def close_redis():
    global _redis, _pubsub_redis
    if _redis:
        await _redis.close()
        _redis = None
    if _pubsub_redis:
        await _pubsub_redis.close()
        _pubsub_redis = None
