import redis.asyncio as redis

from shared.utils.env import get_redis_db, get_redis_host, get_redis_port


_redis: redis.Redis | None = None


def setup_redis():
    global _redis
    _redis = redis.Redis(
        connection_pool=redis.ConnectionPool(
            host=get_redis_host(),
            port=get_redis_port(),
            db=get_redis_db(),
            decode_responses=True,
            health_check_interval=30,
        )
    )


def get_redis() -> redis.Redis:
    return _redis


async def close_redis():
    global _redis
    if _redis:
        await _redis.close()
        _redis = None
