import asyncio

from discord.ext import commands
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild import GuildDTO
from shared.repositories.guild_repository import GuildRepository
from shared.utils.db import get_session
from shared.utils.service import Event, bot_service

from ..utils.guild import delete_guild, sync_guild


async def _sync_guild(
    guild, sem: asyncio.Semaphore, results: list, errors: list
) -> None:
    async with sem:
        try:
            async for session in get_session():
                results.append(await sync_guild(guild, session))
        except Exception as e:
            errors.append({"guild_id": guild.id, "error": str(e)})


@bot_service
async def on_ready_service(
    bot: commands.Bot, session: AsyncSession, event: Event
) -> None:
    synced_guild_ids: set[int] = set()
    synced_guilds: list[dict[str, object]] = []
    errors: list[dict] = []

    sem = asyncio.Semaphore(10)
    tasks = [_sync_guild(guild, sem, synced_guilds, errors) for guild in bot.guilds]
    await asyncio.gather(*tasks)

    for result in synced_guilds:
        synced_guild_ids.add(result["guild"].discord_id)

    guild_repo = GuildRepository(session)
    guild_entities = await guild_repo.get_all()
    removed_guilds: list[GuildDTO] = []
    for guild_entity in guild_entities:
        if guild_entity.discord_id in synced_guild_ids:
            continue
        removed_guilds.append(await delete_guild(guild_entity.discord_id, session))

    event.detail |= {
        "synced_guild_count": len(synced_guilds),
        "removed_guild_count": len(removed_guilds),
        "removed_guilds": removed_guilds,
        "synced_guilds": synced_guilds,
        "error_count": len(errors),
        "errors": errors,
    }
