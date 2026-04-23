import asyncio
import json
from collections.abc import Awaitable, Callable
from typing import Any

from shared.utils.redis import get_redis


async def redis_publish(channel: str, data: Any):
    r = get_redis()
    await r.publish(channel, json.dumps(data))

async def redis_subscribe(channel: str, on_message: Callable[[str, Any], Awaitable[None]]):
    r = get_redis()
    pubsub = r.pubsub()
    await pubsub.subscribe(channel)
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await on_message(message["channel"], json.loads(message["data"]))
    except asyncio.CancelledError:
        await pubsub.unsubscribe(channel)
        await pubsub.close()

async def redis_hset(key: str, data: dict):
    r = get_redis()
    await r.hset(key, mapping=data)

async def redis_hgetall(key: str):
    r = get_redis()
    return await r.hgetall(key)

async def redis_set(key: str, value: str):
    r = get_redis()
    await r.set(key, value)

async def redis_get(key: str):
    r = get_redis()
    return await r.get(key)

async def redis_lpush(key: str, values: list):
    r = get_redis()
    if values:
        await r.delete(key)
        await r.rpush(key, *[str(v) for v in values])

async def redis_lrange(key: str):
    r = get_redis()
    return await r.lrange(key, 0, -1)

async def redis_sadd(key: str, value: str):
    r = get_redis()
    await r.sadd(key, value)

async def redis_sismember(key: str, value: str):
    r = get_redis()
    return await r.sismember(key, value)

async def redis_srem(key: str, value: str):
    r = get_redis()
    await r.srem(key, value)

async def redis_delete(keys: list):
    r = get_redis()
    if keys:
        await r.delete(*keys)
