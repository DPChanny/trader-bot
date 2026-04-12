import asyncio

from discord import Guild, Intents, Member, User
from discord.ext import commands
from loguru import logger

from shared.entities.member import Role
from shared.utils.database import get_session
from shared.utils.env import get_discord_bot_token
from shared.utils.logging import setup_logging
from shared.utils.user import upsert_user

from .utils.guild import delete_guild, upsert_guild
from .utils.member import (
    delete_member,
    set_role,
    update_member,
    upsert_member,
)


setup_logging()


async def main() -> None:
    intents = Intents.default()
    intents.message_content = True
    intents.members = True

    bot = commands.Bot(command_prefix="!", intents=intents)

    @bot.event
    async def on_ready():
        logger.bind(bot_user=str(bot.user)).info("")
        try:
            async for session in get_session():
                for guild in bot.guilds:
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
                            avatar_hash=member.guild_avatar.key
                            if member.guild_avatar
                            else None,
                        )
                    await session.flush()
                    owner_member = await upsert_member(
                        guild_entity.discord_id, owner_discord_id, session
                    )
                    logger.bind(
                        **guild_entity.model_dump(),
                        owner_discord_id=owner_discord_id,
                    ).info("")
                    if Role(owner_member.role) < Role.OWNER:
                        owner_member = await set_role(
                            guild_entity.discord_id,
                            owner_discord_id,
                            Role.OWNER,
                            session,
                        )
                        if owner_member is not None:
                            logger.bind(
                                **owner_member.model_dump(exclude={"avatar_url"})
                            ).info("")
        except Exception as e:
            logger.bind(event="on_ready", exception_type=type(e).__name__).exception("")

    @bot.event
    async def on_guild_join(guild: Guild):
        owner_discord_id = guild.owner_id
        try:
            async for session in get_session():
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
                        avatar_hash=member.guild_avatar.key
                        if member.guild_avatar
                        else None,
                    )
                await session.flush()
                logger.bind(
                    **guild_entity.model_dump(),
                    owner_discord_id=owner_discord_id,
                ).info("")
                owner_member = await set_role(
                    guild_entity.discord_id, owner_discord_id, Role.OWNER, session
                )
                if owner_member is not None:
                    logger.bind(**owner_member.model_dump(exclude={"avatar_url"})).info(
                        ""
                    )
        except Exception as e:
            logger.bind(
                event="on_guild_join", exception_type=type(e).__name__
            ).exception("")

    @bot.event
    async def on_member_join(member: Member):
        if member.bot:
            return
        try:
            async for session in get_session():
                guild_entity = await upsert_guild(
                    member.guild.id,
                    member.guild.name,
                    member.guild.icon.key if member.guild.icon else None,
                    session,
                )
                user = await upsert_user(
                    member.id,
                    member.global_name or member.name,
                    member.avatar.key if member.avatar else None,
                    session,
                )
                member_dto = await upsert_member(
                    guild_entity.discord_id,
                    member.id,
                    session,
                    name=member.nick,
                    avatar_hash=member.guild_avatar.key
                    if member.guild_avatar
                    else None,
                )
                logger.bind(**user.model_dump()).info("")
                logger.bind(**member_dto.model_dump(exclude={"avatar_url"})).info("")
        except Exception as e:
            logger.bind(
                event="on_member_join", exception_type=type(e).__name__
            ).exception("")

    @bot.event
    async def on_member_update(before: Member, after: Member):
        if after.bot:
            return
        if before.nick == after.nick and before.guild_avatar == after.guild_avatar:
            return
        try:
            async for session in get_session():
                guild_entity = await upsert_guild(
                    after.guild.id,
                    after.guild.name,
                    after.guild.icon.key if after.guild.icon else None,
                    session,
                )
                user = await upsert_user(
                    after.id,
                    after.global_name or after.name,
                    after.avatar.key if after.avatar else None,
                    session,
                )
                member_dto = await update_member(
                    guild_entity.discord_id,
                    after.id,
                    name=after.nick,
                    avatar_hash=after.guild_avatar.key if after.guild_avatar else None,
                    session=session,
                )
                logger.bind(**user.model_dump()).info("")
                if member_dto is not None:
                    logger.bind(**member_dto.model_dump(exclude={"avatar_url"})).info(
                        ""
                    )
        except Exception as e:
            logger.bind(
                event="on_member_update", exception_type=type(e).__name__
            ).exception("")

    @bot.event
    async def on_user_update(before: User, after: User):
        if (before.global_name or before.name) == (
            after.global_name or after.name
        ) and before.avatar == after.avatar:
            return
        try:
            async for session in get_session():
                user = await upsert_user(
                    after.id,
                    after.global_name or after.name,
                    after.avatar.key if after.avatar else None,
                    session,
                )
                logger.bind(**user.model_dump()).info("")
        except Exception as e:
            logger.bind(
                event="on_user_update", exception_type=type(e).__name__
            ).exception("")

    @bot.event
    async def on_guild_update(before: Guild, after: Guild):
        if before.owner_id == after.owner_id:
            return
        old_owner = before.owner_id
        new_owner = after.owner_id
        try:
            async for session in get_session():
                guild_entity = await upsert_guild(
                    after.id,
                    after.name,
                    after.icon.key if after.icon else None,
                    session,
                )
                logger.bind(
                    **guild_entity.model_dump(),
                    old_owner_discord_id=old_owner,
                    new_owner_discord_id=new_owner,
                ).info("")
                old_owner_member = await set_role(
                    guild_entity.discord_id, old_owner, Role.ADMIN, session
                )
                new_owner_member = await set_role(
                    guild_entity.discord_id, new_owner, Role.OWNER, session
                )
                if old_owner_member is not None:
                    logger.bind(
                        **old_owner_member.model_dump(exclude={"avatar_url"})
                    ).info("")
                if new_owner_member is not None:
                    logger.bind(
                        **new_owner_member.model_dump(exclude={"avatar_url"})
                    ).info("")
        except Exception as e:
            logger.bind(
                event="on_guild_update", exception_type=type(e).__name__
            ).exception("")

    @bot.event
    async def on_guild_remove(guild: Guild):
        try:
            async for session in get_session():
                await delete_guild(guild.id, session)
                logger.bind(discord_id=guild.id, name=guild.name).info("")
        except Exception as e:
            logger.bind(
                event="on_guild_remove", exception_type=type(e).__name__
            ).exception("")

    @bot.event
    async def on_member_remove(member: Member):
        if member.bot:
            return
        try:
            async for session in get_session():
                guild_entity = await upsert_guild(
                    member.guild.id,
                    member.guild.name,
                    member.guild.icon.key if member.guild.icon else None,
                    session,
                )
                await delete_member(guild_entity.discord_id, member.id, session)
                logger.bind(
                    guild_id=guild_entity.discord_id,
                    user_id=member.id,
                    name=member.name,
                ).info("")
        except Exception as e:
            logger.bind(
                event="on_member_remove", exception_type=type(e).__name__
            ).exception("")

    await bot.start(get_discord_bot_token(), reconnect=True)


if __name__ == "__main__":
    asyncio.run(main())
