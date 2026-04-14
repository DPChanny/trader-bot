from discord.ext import commands
from sqlalchemy.ext.asyncio import AsyncSession

from shared.repositories.guild_repository import GuildRepository
from shared.repositories.member_repository import MemberRepository
from shared.utils.service import bot_service

from ..utils.guild import delete_guild
from ..utils.member import delete_member
from .guild_service import sync_guild_service


@bot_service
async def on_ready_service(bot: commands.Bot, session: AsyncSession, event) -> None:
    synced_member_ids_by_guild_id: dict[int, set[int]] = {}
    synced_guild_ids: set[int] = set()

    for guild in bot.guilds:
        guild_event, synced_member_ids = await sync_guild_service(guild, session)
        event |= guild_event
        synced_guild_ids.add(guild.id)
        synced_member_ids_by_guild_id[guild.id] = synced_member_ids

    member_repo = MemberRepository(session)
    removed_member_count = 0
    for guild_id, synced_member_ids in synced_member_ids_by_guild_id.items():
        member_entities = await member_repo.get_list_by_guild_id(guild_id)
        for member_entity in member_entities:
            if member_entity.user_id in synced_member_ids:
                continue
            await delete_member(guild_id, member_entity.user_id, session)
            removed_member_count += 1

    guild_repo = GuildRepository(session)
    guild_entities = await guild_repo.get_list()
    removed_guild_count = 0
    for guild_entity in guild_entities:
        if guild_entity.discord_id in synced_guild_ids:
            continue
        await delete_guild(guild_entity.discord_id, session)
        removed_guild_count += 1

    event |= {
        "synced_guild_count": len(synced_guild_ids),
        "removed_member_count": removed_member_count,
        "removed_guild_count": removed_guild_count,
    }
