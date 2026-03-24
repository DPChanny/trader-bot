import asyncio

import discord
from fastapi import Depends, HTTPException
from loguru import logger

from shared.dtos.bot_dto import InviteResultDTO
from shared.exception import service_exception_handler

from .utils import get_bot


@service_exception_handler
async def get_profile_service(
    discord_id: str, bot: discord.Client = Depends(get_bot)
) -> bytes:
    try:
        user = await bot.fetch_user(int(discord_id))
    except ValueError:
        raise HTTPException(
            status_code=422, detail=f"Invalid discord_id: {discord_id}"
        ) from None

    profile_bytes = await user.display_avatar.read()
    logger.info(f"Fetched profile bytes: {discord_id}")
    return profile_bytes


@service_exception_handler
async def invite_service(
    invites: list[tuple[str, str]], bot: discord.Client = Depends(get_bot)
) -> InviteResultDTO:

    async def _send(discord_id: str, auction_url: str) -> bool:
        try:
            user = await bot.fetch_user(int(discord_id))
            embed = discord.Embed(title="창식이 내전 경매")
            embed.add_field(name="참가 링크", value=auction_url, inline=False)
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
    total_count = len(invites)
    logger.info(f"Sent: {success_count}/{total_count}")
    return InviteResultDTO(success_count=success_count, total_count=total_count)
