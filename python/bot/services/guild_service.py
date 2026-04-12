from discord import Guild
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.member import Role
from shared.error import service_error_handler
from shared.utils.logging import bind_target_func
from shared.utils.user import upsert_user

from ..utils.guild import delete_guild, upsert_guild
from ..utils.member import upsert_member


@service_error_handler
async def on_guild_join_service(guild: Guild, session: AsyncSession) -> None:
    log = bind_target_func(on_guild_join_service)
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
    log.bind(
        **guild_entity.model_dump(),
        owner_discord_id=owner_discord_id,
    ).info("")

    if Role(owner_member.role) < Role.OWNER:
        owner_member = await upsert_member(
            guild_entity.discord_id,
            owner_discord_id,
            session,
            role=Role.OWNER,
        )
        log.bind(**owner_member.model_dump()).info("")


@service_error_handler
async def on_guild_update_service(
    before: Guild,
    after: Guild,
    session: AsyncSession,
) -> None:
    log = bind_target_func(on_guild_update_service)
    guild_entity = await upsert_guild(
        after.id,
        after.name,
        after.icon.key if after.icon else None,
        session,
    )
    log.bind(
        **guild_entity.model_dump(),
        old_owner_discord_id=before.owner_id,
        new_owner_discord_id=after.owner_id,
    ).info("")
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
    log.bind(**old_owner_member.model_dump()).info("")
    log.bind(**new_owner_member.model_dump()).info("")


@service_error_handler
async def on_guild_remove_service(guild: Guild, session: AsyncSession) -> None:
    log = bind_target_func(on_guild_remove_service)
    await delete_guild(guild.id, session)
    log.bind(discord_id=guild.id, name=guild.name).info("")
