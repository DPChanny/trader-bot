import asyncio

from discord import Guild, Intents, Member, User
from discord.ext import commands
from loguru import logger

from shared.entities.member import Role
from shared.utils.database import get_session, setup_db
from shared.utils.discord_user import upsert_discord_user
from shared.utils.env import get_bot_token
from shared.utils.logging import setup_logging

from .utils.guild import delete_guild, upsert_guild
from .utils.member import (
    delete_member,
    set_role,
    update_member,
    upsert_member,
)


setup_logging()


async def main() -> None:
    await setup_db()

    intents = Intents.default()
    intents.message_content = True
    intents.members = True

    bot = commands.Bot(command_prefix="!", intents=intents)

    @bot.event
    async def on_ready():
        logger.info(f"Ready: {bot.user}")
        async for session in get_session():
            try:
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
                        await upsert_discord_user(
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
                    if Role(owner_member.role) < Role.OWNER:
                        await set_role(
                            guild_entity.discord_id,
                            owner_discord_id,
                            Role.OWNER,
                            session,
                        )
                await session.commit()
                logger.info(f"Synced {len(bot.guilds)} guild(s) on ready")
            except Exception as e:
                await session.rollback()
                logger.exception(f"on_ready sync error: {e}")

    @bot.event
    async def on_guild_join(guild: Guild):
        logger.info(f"Joined guild: {guild.name} ({guild.id})")
        owner_discord_id = guild.owner_id
        async for session in get_session():
            try:
                guild_entity = await upsert_guild(
                    guild.id,
                    guild.name,
                    guild.icon.key if guild.icon else None,
                    session,
                )
                async for member in guild.fetch_members():
                    if member.bot:
                        continue

                    await upsert_discord_user(
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
                await set_role(
                    guild_entity.discord_id, owner_discord_id, Role.OWNER, session
                )
                await session.commit()
                logger.info(
                    f"Guild synced: {guild.name}, owner={owner_discord_id}, members={guild.member_count}"
                )
            except Exception as e:
                await session.rollback()
                logger.exception(f"on_guild_join error: {e}")

    @bot.event
    async def on_member_join(member: Member):
        if member.bot:
            return
        logger.info(
            f"Member joined: {member.name} ({member.id}) in {member.guild.name}"
        )
        async for session in get_session():
            try:
                guild_entity = await upsert_guild(
                    member.guild.id,
                    member.guild.name,
                    member.guild.icon.key if member.guild.icon else None,
                    session,
                )
                await upsert_discord_user(
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
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.exception(f"on_member_join error: {e}")

    @bot.event
    async def on_member_update(before: Member, after: Member):
        if after.bot:
            return
        if before.nick == after.nick and before.guild_avatar == after.guild_avatar:
            return
        logger.info(
            f"Member profile updated: {after.name} ({after.id}) in {after.guild.name}"
        )
        async for session in get_session():
            try:
                guild_entity = await upsert_guild(
                    after.guild.id,
                    after.guild.name,
                    after.guild.icon.key if after.guild.icon else None,
                    session,
                )
                await upsert_discord_user(
                    after.id,
                    after.global_name or after.name,
                    after.avatar.key if after.avatar else None,
                    session,
                )
                await update_member(
                    guild_entity.discord_id,
                    after.id,
                    name=after.nick,
                    avatar_hash=after.guild_avatar.key if after.guild_avatar else None,
                    session=session,
                )
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.exception(f"on_member_update error: {e}")

    @bot.event
    async def on_user_update(before: User, after: User):
        if (before.global_name or before.name) == (
            after.global_name or after.name
        ) and before.avatar == after.avatar:
            return
        logger.info(f"User global profile updated: {after.name} ({after.id})")
        async for session in get_session():
            try:
                await upsert_discord_user(
                    after.id,
                    after.global_name or after.name,
                    after.avatar.key if after.avatar else None,
                    session,
                )
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.exception(f"on_user_update error: {e}")

    @bot.event
    async def on_guild_update(before: Guild, after: Guild):
        if before.owner_id == after.owner_id:
            return
        old_owner = before.owner_id
        new_owner = after.owner_id
        logger.info(
            f"Guild owner changed: {before.name} ({old_owner} \u2192 {new_owner})"
        )
        async for session in get_session():
            try:
                guild_entity = await upsert_guild(
                    after.id,
                    after.name,
                    after.icon.key if after.icon else None,
                    session,
                )
                await set_role(guild_entity.discord_id, old_owner, Role.ADMIN, session)
                await set_role(guild_entity.discord_id, new_owner, Role.OWNER, session)
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.exception(f"on_guild_update error: {e}")

    @bot.event
    async def on_guild_remove(guild: Guild):
        logger.info(f"Left guild: {guild.name} ({guild.id})")
        async for session in get_session():
            try:
                await delete_guild(guild.id, session)
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.exception(f"on_guild_remove error: {e}")

    @bot.event
    async def on_member_remove(member: Member):
        if member.bot:
            return
        logger.info(f"Member left: {member.name} ({member.id}) in {member.guild.name}")
        async for session in get_session():
            try:
                guild_entity = await upsert_guild(
                    member.guild.id,
                    member.guild.name,
                    member.guild.icon.key if member.guild.icon else None,
                    session,
                )
                await delete_member(guild_entity.discord_id, member.id, session)
                await session.commit()
            except Exception as e:
                await session.rollback()
                logger.exception(f"on_member_remove error: {e}")

    await bot.start(get_bot_token(), reconnect=True)


if __name__ == "__main__":
    asyncio.run(main())
