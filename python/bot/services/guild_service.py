from discord import Guild
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.utils.service import bot_service

from ..utils.guild import delete_guild, upsert_guild
from ..utils.member import update_member_role
from .member_service import sync_member_service


async def sync_guild_service(
    guild: Guild, session: AsyncSession
) -> tuple[dict, set[int]]:
    owner_discord_id = guild.owner_id
    guild_id = guild.id
    guild_entity = await upsert_guild(
        guild_id,
        guild.name,
        guild.icon.key if guild.icon else None,
        session,
    )
    synced_member_ids: set[int] = set()

    async for member in guild.fetch_members():
        if member.bot:
            continue
        await sync_member_service(member, session)
        synced_member_ids.add(member.id)

    await session.flush()

    owner_member = await update_member_role(
        guild_id,
        owner_discord_id,
        Role.OWNER,
        session,
    )

    return guild_entity.model_dump() | owner_member.model_dump(), synced_member_ids


@bot_service
async def on_guild_join_service(guild: Guild, session: AsyncSession, event) -> None:
    guild_event, _ = await sync_guild_service(guild, session)
    event |= guild_event


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
