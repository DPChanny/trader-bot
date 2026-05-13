from discord import Guild as DiscordGuild
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild import GuildDTO
from shared.dtos.member import Role
from shared.entities import Member
from shared.repositories.guild_repository import GuildRepository
from shared.repositories.member_repository import MemberRepository
from shared.repositories.user_repository import UserRepository
from shared.utils.error import AppError, NotFoundErrorCode


async def upsert_guild(guild: DiscordGuild, session: AsyncSession) -> GuildDTO:
    repo = GuildRepository(session)
    entity = await repo.upsert(
        discord_id=guild.id,
        name=guild.name,
        icon_hash=guild.icon.key if guild.icon else None,
    )
    return GuildDTO.model_validate(entity)


async def delete_guild(guild_id: int, session: AsyncSession) -> GuildDTO:
    repo = GuildRepository(session)
    entity = await repo.get_by_id(guild_id)
    if entity is None:
        raise AppError(NotFoundErrorCode.Guild)
    dto = GuildDTO.model_validate(entity)
    await session.delete(entity)
    return dto


async def sync_guild(guild: DiscordGuild, session: AsyncSession) -> dict[str, object]:
    user_dicts: list[dict] = []
    member_dicts: list[dict] = []
    active_user_ids: set[int] = set()

    async for member in guild.fetch_members():
        if member.bot:
            continue
        if member.id == guild.owner_id:
            role = Role.OWNER
        elif member.guild_permissions.administrator:
            role = Role.ADMIN
        else:
            role = Role.VIEWER
        user_dicts.append(
            {
                "discord_id": member.id,
                "name": member.global_name or member.name,
                "avatar_hash": member.avatar.key if member.avatar else None,
            }
        )
        member_dicts.append(
            {
                "guild_id": guild.id,
                "user_id": member.id,
                "name": member.nick,
                "avatar_hash": member.guild_avatar.key if member.guild_avatar else None,
                "role": role,
            }
        )
        active_user_ids.add(member.id)

    guild_dto = await upsert_guild(guild, session)
    await UserRepository(session).bulk_upsert(user_dicts)
    await MemberRepository(session).bulk_upsert(member_dicts)

    removed_count = 0
    if active_user_ids:
        stmt = delete(Member).where(
            Member.guild_id == guild.id, Member.user_id.not_in(active_user_ids)
        )
        result = await session.execute(stmt)
        removed_count = result.rowcount

    return {
        "guild": guild_dto,
        "synced_member_count": len(member_dicts),
        "removed_member_count": removed_count,
    }
