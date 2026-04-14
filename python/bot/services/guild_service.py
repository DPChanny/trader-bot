from discord import Guild
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.repositories.member_repository import MemberRepository
from shared.utils.service import bot_service

from ..utils.guild import delete_guild, upsert_guild
from ..utils.member import delete_member, update_member_role
from .member_service import sync_member_service


async def sync_guild_service(guild: Guild, session: AsyncSession) -> dict:
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
        guild.owner_id,
        Role.OWNER,
        session,
    )

    member_repo = MemberRepository(session)
    removed_member_count = 0
    member_entities = await member_repo.get_list_by_guild_id(guild.id)
    for member_entity in member_entities:
        if member_entity.user_id in synced_member_ids:
            continue
        await delete_member(guild.id, member_entity.user_id, session)
        removed_member_count += 1

    return (
        guild_entity.model_dump()
        | owner_member.model_dump()
        | {
            "synced_member_count": len(synced_member_ids),
            "removed_member_count": removed_member_count,
        }
    )


@bot_service
async def on_guild_join_service(guild: Guild, session: AsyncSession, event) -> None:
    event |= await sync_guild_service(guild, session)


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
    event |= guild_entity.model_dump()
    if before.owner_id != after.owner_id:
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
        event |= {
            "old_owner_discord_id": before.owner_id,
            "new_owner_discord_id": after.owner_id,
        }


@bot_service
async def on_guild_remove_service(guild: Guild, session: AsyncSession, event) -> None:
    guild_dto = await delete_guild(guild.id, session)
    event |= guild_dto.model_dump()
