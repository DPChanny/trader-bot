import asyncio

from discord.ext import commands
from loguru import logger

from shared.entities.member import Role
from shared.utils.database import get_async_db, setup_db
from shared.utils.env import get_bot_token
from shared.utils.logging import setup_logging

from .utils import setup_intents
from .utils.guild import delete_guild, upsert_guild
from .utils.member import (
    delete_member,
    get_global_avatar_url,
    get_guild_avatar_url,
    set_role,
    update_discord_global,
    update_member,
    upsert_member,
)


setup_logging()
setup_db()


async def main() -> None:
    intents = setup_intents()
    bot = commands.Bot(command_prefix="!", intents=intents)

    @bot.event
    async def on_ready():
        logger.info(f"Ready: {bot.user}")
        async for db in get_async_db():
            try:
                for guild in bot.guilds:
                    owner_discord_id = str(guild.owner_id)
                    guild_entity = await upsert_guild(guild, db)
                    async for member in guild.fetch_members():
                        if member.bot:
                            continue
                        await upsert_member(
                            guild_entity.guild_id,
                            str(member.id),
                            db,
                            discord_name=member.global_name or member.name,
                            discord_avatar_url=get_global_avatar_url(member),
                            guild_nick=member.nick,
                            guild_avatar_url=get_guild_avatar_url(member),
                        )
                    owner_member = await upsert_member(
                        guild_entity.guild_id, owner_discord_id, db
                    )
                    if Role(owner_member.role) < Role.OWNER:
                        await set_role(
                            guild_entity.guild_id, owner_discord_id, Role.OWNER, db
                        )
                await db.commit()
                logger.info(f"Synced {len(bot.guilds)} guild(s) on ready")
            except Exception as e:
                await db.rollback()
                logger.exception(f"on_ready sync error: {e}")

    @bot.event
    async def on_guild_join(guild):
        logger.info(f"Joined guild: {guild.name} ({guild.id})")
        owner_discord_id = str(guild.owner_id)
        async for db in get_async_db():
            try:
                guild_entity = await upsert_guild(guild, db)
                async for member in guild.fetch_members():
                    if member.bot:
                        continue

                    await upsert_member(
                        guild_entity.guild_id,
                        str(member.id),
                        db,
                        discord_name=member.global_name or member.name,
                        discord_avatar_url=get_global_avatar_url(member),
                        guild_nick=member.nick,
                        guild_avatar_url=get_guild_avatar_url(member),
                    )
                await set_role(guild_entity.guild_id, owner_discord_id, Role.OWNER, db)
                await db.commit()
                logger.info(
                    f"Guild synced: {guild.name}, owner={owner_discord_id}, members={guild.member_count}"
                )
            except Exception as e:
                await db.rollback()
                logger.exception(f"on_guild_join error: {e}")

    @bot.event
    async def on_member_join(member):
        if member.bot:
            return
        logger.info(
            f"Member joined: {member.name} ({member.id}) in {member.guild.name}"
        )
        async for db in get_async_db():
            try:
                guild_entity = await upsert_guild(member.guild, db)
                await upsert_member(
                    guild_entity.guild_id,
                    str(member.id),
                    db,
                    discord_name=member.global_name or member.name,
                    discord_avatar_url=get_global_avatar_url(member),
                    guild_nick=member.nick,
                    guild_avatar_url=get_guild_avatar_url(member),
                )
                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.exception(f"on_member_join error: {e}")

    @bot.event
    async def on_member_update(before, after):
        if after.bot:
            return
        if before.nick == after.nick and before.guild_avatar == after.guild_avatar:
            return
        logger.info(
            f"Member profile updated: {after.name} ({after.id}) in {after.guild.name}"
        )
        async for db in get_async_db():
            try:
                guild_entity = await upsert_guild(after.guild, db)
                await update_member(
                    guild_entity.guild_id,
                    str(after.id),
                    discord_name=after.global_name or after.name,
                    discord_avatar_url=get_global_avatar_url(after),
                    guild_nick=after.nick,
                    guild_avatar_url=get_guild_avatar_url(after),
                    db=db,
                )
                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.exception(f"on_member_update error: {e}")

    @bot.event
    async def on_user_update(before, after):
        if (before.global_name or before.name) == (
            after.global_name or after.name
        ) and before.avatar == after.avatar:
            return
        logger.info(f"User global profile updated: {after.name} ({after.id})")
        async for db in get_async_db():
            try:
                await update_discord_global(
                    str(after.id),
                    after.global_name or after.name,
                    get_global_avatar_url(after),
                    db,
                )
                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.exception(f"on_user_update error: {e}")

    @bot.event
    async def on_guild_update(before, after):
        if before.owner_id == after.owner_id:
            return
        old_owner = str(before.owner_id)
        new_owner = str(after.owner_id)
        logger.info(f"Guild owner changed: {before.name} ({old_owner} → {new_owner})")
        async for db in get_async_db():
            try:
                guild_entity = await upsert_guild(after, db)
                await set_role(guild_entity.guild_id, old_owner, Role.ADMIN, db)
                await set_role(guild_entity.guild_id, new_owner, Role.OWNER, db)
                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.exception(f"on_guild_update error: {e}")

    @bot.event
    async def on_guild_remove(guild):
        logger.info(f"Left guild: {guild.name} ({guild.id})")
        async for db in get_async_db():
            try:
                await delete_guild(str(guild.id), db)
                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.exception(f"on_guild_remove error: {e}")

    @bot.event
    async def on_member_remove(member):
        if member.bot:
            return
        logger.info(f"Member left: {member.name} ({member.id}) in {member.guild.name}")
        async for db in get_async_db():
            try:
                guild_entity = await upsert_guild(member.guild, db)
                await delete_member(guild_entity.guild_id, str(member.id), db)
                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.exception(f"on_member_remove error: {e}")

    await bot.start(get_bot_token(), reconnect=True)


if __name__ == "__main__":
    asyncio.run(main())
