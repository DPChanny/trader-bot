from discord import Guild as DiscordGuild
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild import GuildDTO
from shared.dtos.member import Role
from shared.entities.guild import Guild
from shared.repositories.guild_repository import GuildRepository
from shared.repositories.member_repository import MemberRepository
from shared.utils.error import AppError, GuildErrorCode

from .member import (
    delete_member,
    sync_member,
    sync_member_admin_role,
    update_member_role,
)


async def upsert_guild(guild: DiscordGuild, session: AsyncSession) -> GuildDTO:
    guild_id = guild.id
    name = guild.name
    icon_hash = guild.icon.key if guild.icon else None
    repo = GuildRepository(session)
    entity = await repo.get_by_id(guild_id)
    if entity is None:
        entity = Guild(discord_id=guild_id, name=name, icon_hash=icon_hash)
        session.add(entity)
        await session.flush()
    else:
        entity.name = name
        entity.icon_hash = icon_hash

    return GuildDTO.model_validate(entity)


async def delete_guild(guild_id: int, session: AsyncSession) -> GuildDTO:
    repo = GuildRepository(session)
    entity = await repo.get_by_id(guild_id)
    if entity is None:
        raise AppError(GuildErrorCode.NotFound)
    dto = GuildDTO.model_validate(entity)
    await session.delete(entity)
    return dto


async def sync_guild(guild: DiscordGuild, session: AsyncSession) -> None:
    guild_id = guild.id
    await upsert_guild(guild, session)

    synced_member_ids: set[int] = set()
    async for member in guild.fetch_members():
        if member.bot:
            continue
        await sync_member(member, session)
        if member.guild_permissions.administrator and member.id != guild.owner_id:
            await sync_member_admin_role(guild_id, member.id, True, session)
        synced_member_ids.add(member.id)

    await session.flush()

    await update_member_role(guild_id, guild.owner_id, Role.OWNER, session)

    member_repo = MemberRepository(session)
    removed_member_count = 0
    member_entities = await member_repo.get_all_by_guild_id(guild.id)
    for member_entity in member_entities:
        if member_entity.user_id in synced_member_ids:
            continue
        await delete_member(guild.id, member_entity.user_id, session)
        removed_member_count += 1

    return {
        "synced_member_count": len(synced_member_ids),
        "removed_member_count": removed_member_count,
    }
