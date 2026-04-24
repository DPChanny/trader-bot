import redis.asyncio as redis

from shared.utils.env import get_redis_db, get_redis_host, get_redis_port


_redis_client = None


def setup_redis():
    global _redis_client
    if _redis_client is None:
        pool = redis.ConnectionPool(
            host=get_redis_host(),
            port=get_redis_port(),
            db=get_redis_db(),
            decode_responses=True,
        )
        _redis_client = redis.Redis(connection_pool=pool)


def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        pool = redis.ConnectionPool(
            host=get_redis_host(),
            port=get_redis_port(),
            db=get_redis_db(),
            decode_responses=True,
        )
        _redis_client = redis.Redis(connection_pool=pool)
    return _redis_client
