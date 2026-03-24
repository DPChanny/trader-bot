import asyncio

import discord
from loguru import logger


_bot: discord.Client | None = None


async def get_profile_bytes(discord_id: str) -> bytes | None:
    if not _bot or not _bot.is_ready():
        logger.error("Bot not ready")
        return None

    try:
        user = await _bot.fetch_user(int(discord_id))
        if not user:
            logger.error(f"Missing: {discord_id}")
            return None

        profile_bytes = await user.display_avatar.read()
        logger.info(f"Fetched profile bytes: {discord_id}")
        return profile_bytes

    except ValueError:
        logger.error(f"Invalid discord_id: {discord_id}")
        return None
    except Exception:
        logger.exception(f"Discord get profile bytes failed: discord_id={discord_id}")
        return None


async def send_auction_urls(invites: list[tuple[str, str]]) -> None:
    if not _bot or not _bot.is_ready():
        logger.error("Bot not ready")
        return

    async def _send(discord_id: str, auction_url: str) -> bool:
        try:
            user = await _bot.fetch_user(int(discord_id))
            if not user:
                logger.error(f"Missing: {discord_id}")
                return False

            embed = discord.Embed(title="창식이 내전 경매")
            embed.add_field(name="참가 링크", value=auction_url, inline=False)

            logger.info(f"Sending: {discord_id}")
            await user.send(embed=embed)
            logger.info(f"Sent: {discord_id}")
            return True

        except discord.Forbidden:
            logger.debug(f"DM blocked: {discord_id}")
            return False
        except ValueError:
            logger.debug(f"Invalid discord_id: {discord_id}")
            return False
        except Exception as e:
            logger.debug(f"Invite failed: {discord_id}: {e}")
            return False

    results = await asyncio.gather(
        *[_send(discord_id, url) for discord_id, url in invites],
        return_exceptions=True,
    )

    success_count = sum(1 for r in results if r is True)
    logger.info(f"Sent: {success_count}/{len(invites)}")
