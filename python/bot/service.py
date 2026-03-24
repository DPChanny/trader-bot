import asyncio
import contextlib

import discord
from discord.ext import commands
from loguru import logger

from shared.env import get_discord_bot_token


class DiscordBotService:
    def __init__(self):
        self.bot: commands.Bot | None = None
        self.token = get_discord_bot_token()
        self._ready = False
        self._task: asyncio.Task | None = None

    async def start(self):
        if not self.token:
            logger.error("Token missing")
            return

        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True

        self.bot = commands.Bot(command_prefix="!", intents=intents)

        @self.bot.event
        async def on_ready():
            logger.info(f"Ready: {self.bot.user}")
            self._ready = True

        @self.bot.event
        async def on_disconnect():
            logger.warning("Disconnected")
            self._ready = False

        @self.bot.event
        async def on_resumed():
            logger.info("Resumed")
            self._ready = True

        @self.bot.event
        async def on_error(event, *args, **kwargs):
            logger.exception(f"Discord bot error: event={event}")

        self._task = asyncio.create_task(self.bot.start(self.token, reconnect=True))

        for _ in range(60):
            if self._ready:
                break
            await asyncio.sleep(1)

        if not self._ready:
            logger.warning("Startup timeout")

    async def stop(self):
        if self.bot:
            try:
                logger.info("Stopping...")
                await self.bot.close()
                logger.info("Bot closed")
            except Exception as e:
                logger.exception(f"Discord bot stop error: {e}")

        if self._task and not self._task.done():
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task

        self._ready = False
        logger.info("Stopped")

    async def get_profile_bytes(self, discord_id: str) -> bytes | None:
        if not self.bot or not self._ready:
            logger.error("Bot not ready")
            return None

        try:
            user = await self.bot.fetch_user(int(discord_id))
            if not user:
                logger.error(f"Missing: {discord_id}")
                return None

            profile_bytes = await user.display_avatar.read()
            logger.info(f"Fetched profile bytes: {discord_id}")
            return profile_bytes

        except ValueError:
            logger.error(f"Invalid discord_id: {discord_id}")
            return None
        except Exception:
            logger.exception(
                f"Discord get profile bytes failed: discord_id={discord_id}"
            )
            return None

    async def send_auction_urls(self, invites: list[tuple[str, str]]) -> None:
        if not self.bot or not self._ready:
            logger.error("Bot not ready")
            return

        async def _send(discord_id: str, auction_url: str):
            try:
                user = await self.bot.fetch_user(int(discord_id))
                if not user:
                    logger.error(f"Missing: {discord_id}")
                    return False

                embed = discord.Embed(title="창식이 내전 경매")
                embed.add_field(name="참가 링크", value=auction_url, inline=False)

                logger.info(f"Sending: {discord_id}")
                await user.send(embed=embed)
                logger.info(f"Sent: {discord_id}")
                return True

            except discord.Forbidden:
                logger.debug(f"DM blocked: {discord_id}")
                return False
            except ValueError:
                logger.debug(f"Invalid discord_id: {discord_id}")
                return False
            except Exception as e:
                logger.debug(f"Invite failed: {discord_id}: {e}")
                return False

        results = await asyncio.gather(
            *[_send(discord_id, url) for discord_id, url in invites],
            return_exceptions=True,
        )

        success_count = sum(1 for r in results if r is True)
        logger.info(f"Sent: {success_count}/{len(invites)}")


bot_service = DiscordBotService()
