from discord import Guild
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.member import Role
from shared.utils.service import bot_service
from shared.utils.user import upsert_user

from ..utils.guild import delete_guild, upsert_guild
from ..utils.member import update_member_role, upsert_member


@bot_service
async def on_guild_join_service(guild: Guild, session: AsyncSession, event) -> None:
    owner_discord_id = guild.owner_id
    guild_id = guild.id
    guild_entity = await upsert_guild(
        guild_id,
        guild.name,
        guild.icon.key if guild.icon else None,
        session,
    )

    async for member in guild.fetch_members():
        if member.bot:
            continue

        await upsert_user(
            member.id,
            member.global_name or member.name,
            member.avatar.key if member.avatar else None,
            session,
        )
        await upsert_member(
            guild_id,
            member.id,
            session,
            name=member.nick,
            avatar_hash=member.guild_avatar.key if member.guild_avatar else None,
        )

    await session.flush()

    owner_member = await update_member_role(
        guild_id,
        owner_discord_id,
        Role.OWNER,
        session,
    )

    event |= guild_entity.model_dump() | owner_member.model_dump()


@bot_service
async def on_guild_update_service(
    before: Guild,
    after: Guild,
    session: AsyncSession,
    event,
) -> None:
    guild_id = after.id
    guild_entity = await upsert_guild(
        guild_id,
        after.name,
        after.icon.key if after.icon else None,
        session,
    )
    await update_member_role(
        guild_id,
        before.owner_id,
        Role.ADMIN,
        session,
    )
    await update_member_role(
        guild_id,
        after.owner_id,
        Role.OWNER,
        session,
    )
    event |= guild_entity.model_dump() | {
        "old_owner_discord_id": before.owner_id,
        "new_owner_discord_id": after.owner_id,
    }


@bot_service
async def on_guild_remove_service(guild: Guild, session: AsyncSession, event) -> None:
    guild_dto = await delete_guild(guild.id, session)
    event |= guild_dto.model_dump()
