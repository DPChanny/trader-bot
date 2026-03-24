import httpx
from fastapi import HTTPException
from loguru import logger

from shared.env import get_bot_origin


def _raise(e: httpx.HTTPStatusError | httpx.RequestError) -> None:
    if isinstance(e, httpx.HTTPStatusError):
        raise HTTPException(
            status_code=e.response.status_code, detail=f"Bot error: {e.response.text}"
        ) from e
    raise HTTPException(status_code=503, detail="Bot unreachable") from e


async def get_profile(discord_id: str) -> bytes:
    url = f"{get_bot_origin()}/bot/profile"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json={"discord_id": discord_id})
        response.raise_for_status()
    except (httpx.HTTPStatusError, httpx.RequestError) as e:
        _raise(e)
    logger.info(f"Profile fetched: discord_id={discord_id}")
    return response.content


async def invite(invites: list[tuple[str, str]]) -> None:
    url = f"{get_bot_origin()}/bot/invite"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json={"invites": invites})
        response.raise_for_status()
    except (httpx.HTTPStatusError, httpx.RequestError) as e:
        _raise(e)
    logger.info(f"Invited: count={len(invites)}")
