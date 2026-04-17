from discord.ext import commands
from sqlalchemy.ext.asyncio import AsyncSession

from shared.repositories.guild_repository import GuildRepository
from shared.utils.service import Event, bot_service

from ..utils.guild import delete_guild, sync_guild


@bot_service
async def on_ready_service(
    bot: commands.Bot, session: AsyncSession, event: Event
) -> None:
    synced_guild_ids: set[int] = set()

    for guild in bot.guilds:
        await sync_guild(guild, session)
        synced_guild_ids.add(guild.id)

    guild_repo = GuildRepository(session)
    guild_entities = await guild_repo.get_all()
    removed_guild_count = 0
    for guild_entity in guild_entities:
        if guild_entity.discord_id in synced_guild_ids:
            continue
        await delete_guild(guild_entity.discord_id, session)
        removed_guild_count += 1

    event.detail = {
        "synced_guild_count": len(synced_guild_ids),
        "removed_guild_count": removed_guild_count,
    }
