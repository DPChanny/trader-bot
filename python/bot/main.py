import asyncio

from discord.ext import commands
from loguru import logger

from shared.entities.member import Role
from shared.utils.database import get_async_db, setup_db
from shared.utils.env import get_bot_token
from shared.utils.logging import setup_logging

from .utils import setup_intents
from .utils.discord import upsert_discord
from .utils.guild import upsert_guild
from .utils.member import delete_member, set_role, upsert_member


setup_logging()
setup_db()


async def main() -> None:
    intents = setup_intents()
    bot = commands.Bot(command_prefix="!", intents=intents)

    @bot.event
    async def on_ready():
        logger.info(f"Ready: {bot.user}")
        await bot.tree.sync()

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
                    await upsert_discord(member, db)
                    await upsert_member(guild_entity.guild_id, str(member.id), db)
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
                await upsert_discord(member, db)
                guild_entity = await upsert_guild(member.guild, db)
                await upsert_member(guild_entity.guild_id, str(member.id), db)
                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.exception(f"on_member_join error: {e}")

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
