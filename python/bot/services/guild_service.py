from discord import Guild
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.utils.service import bot_service

from ..utils.guild import delete_guild, sync_guild, upsert_guild
from ..utils.member import update_member_role


@bot_service
async def on_guild_join_service(guild: Guild, session: AsyncSession) -> None:
    await sync_guild(guild, session)


@bot_service
async def on_guild_update_service(
    before: Guild,
    after: Guild,
    session: AsyncSession,
) -> None:
    guild_id = after.id
    await upsert_guild(after, session)
    if before.owner_id != after.owner_id:
        await update_member_role(guild_id, before.owner_id, Role.ADMIN, session)
        await update_member_role(guild_id, after.owner_id, Role.OWNER, session)


@bot_service
async def on_guild_remove_service(guild: Guild, session: AsyncSession) -> None:
    await delete_guild(guild.id, session)
