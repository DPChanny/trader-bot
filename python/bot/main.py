import asyncio

from discord.ext import commands
from loguru import logger

from shared.utils.database import get_async_db, setup_db
from shared.utils.env import get_bot_token
from shared.utils.logging import setup_logging

from .utils import setup_intents, upsert_discord, upsert_guild, upsert_member


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
        async for db in get_async_db():
            try:
                guild_entity = await upsert_guild(guild, db)
                async for member in guild.fetch_members():
                    if member.bot:
                        continue
                    await upsert_discord(member, db)
                    await upsert_member(guild_entity.guild_id, str(member.id), db)
                await db.commit()
                logger.info(f"Guild synced: {guild.name}, members={guild.member_count}")
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
    async def on_member_remove(member):
        if member.bot:
            return
        logger.info(f"Member left: {member.name} ({member.id}) in {member.guild.name}")
        from sqlalchemy import select

        from shared.entities.guild import Guild
        from shared.entities.member import Member

        async for db in get_async_db():
            try:
                guild_result = await db.execute(
                    select(Guild).where(Guild.discord_id == str(member.guild.id))
                )
                guild_entity = guild_result.scalar_one_or_none()
                if guild_entity is None:
                    return
                member_result = await db.execute(
                    select(Member).where(
                        Member.guild_id == guild_entity.guild_id,
                        Member.discord_id == str(member.id),
                    )
                )
                member_entity = member_result.scalar_one_or_none()
                if member_entity is not None:
                    await db.delete(member_entity)
                    await db.commit()
            except Exception as e:
                await db.rollback()
                logger.exception(f"on_member_remove error: {e}")

    await bot.start(get_bot_token(), reconnect=True)


if __name__ == "__main__":
    asyncio.run(main())
