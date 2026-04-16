from discord import Guild
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.utils.service import bot_service

from ..utils.guild import delete_guild, sync_guild, upsert_guild
from ..utils.member import update_member_role


@bot_service
async def on_guild_join_service(guild: Guild, session: AsyncSession, event) -> None:
    event |= await sync_guild(guild, session)


@bot_service
async def on_guild_update_service(
    before: Guild,
    after: Guild,
    session: AsyncSession,
    event,
) -> None:
    guild_id = after.id
    guild_entity = await upsert_guild(after, session)
    event |= guild_entity.model_dump()
    if before.owner_id != after.owner_id:
        await update_member_role(guild_id, before.owner_id, Role.ADMIN, session)
        await update_member_role(guild_id, after.owner_id, Role.OWNER, session)
        event |= {
            "old_owner_discord_id": before.owner_id,
            "new_owner_discord_id": after.owner_id,
        }


@bot_service
async def on_guild_remove_service(guild: Guild, session: AsyncSession, event) -> None:
    guild_dto = await delete_guild(guild.id, session)
    event |= guild_dto.model_dump()
