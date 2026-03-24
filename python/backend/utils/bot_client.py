import httpx
from loguru import logger

from shared.env import get_bot_origin


async def get_profile_bytes(discord_id: str) -> bytes | None:
    url = f"{get_bot_origin()}/bot/profile"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json={"discord_id": discord_id})
        if response.status_code == 200:
            return response.content
        logger.warning(
            f"Bot profile request failed: status={response.status_code}, discord_id={discord_id}"
        )
        return None
    except Exception as e:
        logger.error(f"Bot client get_profile_bytes error: {e}")
        return None


async def send_auction_urls(invites: list[tuple[str, str]]) -> None:
    url = f"{get_bot_origin()}/bot/send-auction-urls"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(url, json={"invites": invites})
    except Exception as e:
        logger.error(f"Bot client send_auction_urls error: {e}")
