import redis.asyncio as redis

from .env import get_redis_db, get_redis_host, get_redis_port


_redis_client = None

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

async def close_redis() -> None:
    global _redis_client
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
