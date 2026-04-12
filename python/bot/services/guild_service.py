from discord import Guild
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.member import Role
from shared.utils.service import service
from shared.utils.user import upsert_user

from ..utils.guild import delete_guild, upsert_guild
from ..utils.member import upsert_member


@service
async def on_guild_join_service(guild: Guild, session: AsyncSession, logger) -> None:
    owner_discord_id = guild.owner_id
    guild_entity = await upsert_guild(
        guild.id,
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
            guild_entity.discord_id,
            member.id,
            session,
            name=member.nick,
            avatar_hash=member.guild_avatar.key if member.guild_avatar else None,
        )

    await session.flush()

    owner_member = await upsert_member(
        guild_entity.discord_id, owner_discord_id, session
    )
    logger.bind(
        **guild_entity.model_dump(),
        owner_discord_id=owner_discord_id,
    )

    if Role(owner_member.role) < Role.OWNER:
        owner_member = await upsert_member(
            guild_entity.discord_id,
            owner_discord_id,
            session,
            role=Role.OWNER,
        )
        logger.bind(**owner_member.model_dump())


@service
async def on_guild_update_service(
    before: Guild,
    after: Guild,
    session: AsyncSession,
    logger,
) -> None:
    guild_entity = await upsert_guild(
        after.id,
        after.name,
        after.icon.key if after.icon else None,
        session,
    )
    logger.bind(
        **guild_entity.model_dump(),
        old_owner_discord_id=before.owner_id,
        new_owner_discord_id=after.owner_id,
    )
    old_owner_member = await upsert_member(
        guild_entity.discord_id,
        before.owner_id,
        session,
        role=Role.ADMIN,
    )
    new_owner_member = await upsert_member(
        guild_entity.discord_id,
        after.owner_id,
        session,
        role=Role.OWNER,
    )
    logger.bind(**old_owner_member.model_dump())
    logger.bind(**new_owner_member.model_dump())


@service
async def on_guild_remove_service(guild: Guild, session: AsyncSession, logger) -> None:
    await delete_guild(guild.id, session)
    logger.bind(discord_id=guild.id, name=guild.name)
