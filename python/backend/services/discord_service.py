import asyncio
import logging
import threading

import discord
from discord.ext import commands

from shared.env import get_discord_bot_token


logger = logging.getLogger(__name__)


class DiscordBotService:
    def __init__(self):
        self.bot: commands.Bot | None = None
        self.token = get_discord_bot_token()
        self._ready = False
        self._loop: asyncio.AbstractEventLoop | None = None
        self._thread: threading.Thread | None = None
        self._should_run = True
        self._reconnect_task: asyncio.Task | None = None
        self._state_lock = threading.Lock()

    def _run_bot(self):
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)

        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True

        self.bot = commands.Bot(command_prefix="!", intents=intents)

        @self.bot.event
        async def on_ready():
            logger.info(f"Ready: {self.bot.user}")
            with self._state_lock:
                self._ready = True

        @self.bot.event
        async def on_disconnect():
            logger.warning("Disconnected")
            with self._state_lock:
                self._ready = False

        @self.bot.event
        async def on_resumed():
            logger.info("Resumed")
            with self._state_lock:
                self._ready = True

        @self.bot.event
        async def on_error(event, *args, **kwargs):
            logger.error(f"Discord error in {event}")
            import traceback

            logger.error(traceback.format_exc())

        while self._should_run:
            try:
                self._loop.run_until_complete(
                    self.bot.start(self.token, reconnect=True)
                )
            except discord.ConnectionClosed as e:
                logger.warning(f"Connection closed: {e}")
                self._ready = False
                if self._should_run:
                    logger.info("Reconnecting in 5 seconds...")
                    asyncio.run(asyncio.sleep(5))
                else:
                    break
            except KeyboardInterrupt:
                logger.info("Keyboard interrupt")
                break
            except Exception as e:
                logger.error(f"Start failed: {e}")
                import traceback

                logger.error(traceback.format_exc())
                self._ready = False
                if self._should_run:
                    logger.info("Reconnecting in 5 seconds...")
                    asyncio.run(asyncio.sleep(5))
                else:
                    break

    async def start(self):
        if not self.token:
            logger.error("Token missing")
            return

        self._thread = threading.Thread(
            target=self._run_bot,
            daemon=False,
            name="DiscordBotThread",
        )
        self._thread.start()

        for _ in range(60):
            if self._ready:
                break
            await asyncio.sleep(1)

        if not self._ready:
            logger.warning("Startup timeout")

    async def stop(self):
        if self.bot and self._loop:
            try:
                logger.info("Stopping...")
                with self._state_lock:
                    self._should_run = False

                if self._loop.is_running():
                    future = asyncio.run_coroutine_threadsafe(
                        self.bot.close(), self._loop
                    )
                    try:
                        future.result(timeout=5.0)
                        logger.info("Bot closed")
                    except Exception as e:
                        logger.warning(f"Bot close timeout or error: {e}")

                    self._loop.call_soon_threadsafe(self._loop.stop)
                    logger.info("Loop stop signal sent")

                if self._thread and self._thread.is_alive():
                    self._thread.join(timeout=5.0)
                    if self._thread.is_alive():
                        logger.warning("Thread still alive after timeout")
                    else:
                        logger.info("Thread stopped")

                with self._state_lock:
                    self._ready = False
                logger.info("Stopped")
            except Exception as e:
                logger.error(f"Stop error: {e}")
                import traceback

                logger.error(traceback.format_exc())

    def send_auction_urls(self, invites: list[tuple[str, str]]) -> None:
        with self._state_lock:
            is_ready = self._ready
            loop = self._loop
            loop_running = loop and loop.is_running()

        if not self.bot or not is_ready:
            logger.error("Bot not ready")
            return 0

        if not loop_running:
            logger.error("Loop not running")
            return

        asyncio.run_coroutine_threadsafe(self._send_auction_urls(invites), loop)

    async def _send_auction_urls(
        self, invites: list[tuple[str, str]]
    ) -> dict[str, bool]:
        async def _send_auction_url(discord_id: str, auction_url: str):
            try:
                user_id = int(discord_id)
                user = await self.bot.fetch_user(user_id)

                if not user:
                    logger.error(f"User not found: {discord_id}")
                    return False

                embed = discord.Embed(title="창식이 내전 경매")
                embed.add_field(
                    name="참가 링크",
                    value=auction_url,
                    inline=False,
                )

                logger.info(f"Sending URL to {discord_id}: {auction_url}")
                await user.send(embed=embed)
                logger.info(f"Sent: {discord_id}")
                return True

            except discord.Forbidden:
                logger.debug(f"DM blocked: {discord_id}")
                return False
            except ValueError:
                logger.debug(f"Invalid discord_id format: {discord_id}")
                return False
            except Exception as e:
                logger.debug(f"Invite error {discord_id}: {e}")
                return False

        try:
            results = await asyncio.gather(
                *[
                    _send_auction_url(discord_id, auction_url)
                    for discord_id, auction_url in invites
                ],
                return_exceptions=True,
            )

            result_dict = {}
            for (discord_id, auction_url), result in zip(
                invites, results, strict=False
            ):
                if isinstance(result, Exception) or not result:
                    result_dict[discord_id] = False
                    logger.info(f"Invite failed: {discord_id} {auction_url}")
                else:
                    result_dict[discord_id] = result

            success_count = sum(1 for r in result_dict.values() if r)
            logger.info(f"Invites sent: {success_count}/{len(invites)}")
            return result_dict
        except Exception as e:
            logger.error(f"Batch invite error: {e}")
            return {discord_id: False for discord_id, _ in invites}

    async def fetch_profile_url(self, discord_id: str) -> str | None:

        with self._state_lock:
            is_ready = self._ready
            loop = self._loop
            loop_running = loop and loop.is_running()

        if not self.bot or not is_ready:
            logger.error("Bot not ready")
            return None

        if not loop_running:
            logger.error("Loop not running")
            return None

        future = asyncio.run_coroutine_threadsafe(
            self._fetch_profile_url(discord_id), loop
        )

        try:
            return future.result(timeout=30.0)
        except Exception as e:
            logger.error(f"Failed to fetch profile URL: {e}")
            return None

    async def _fetch_profile_url(self, discord_id: str) -> str | None:
        try:
            user_id_int = int(discord_id)
            user = await self.bot.fetch_user(user_id_int)

            if not user:
                logger.error(f"User not found: {discord_id}")
                return None

            profile_url = user.display_avatar.url
            logger.info(f"Profile URL fetched: {discord_id}")
            return profile_url

        except ValueError:
            logger.error(f"Invalid discord_id format: {discord_id}")
            return None
        except Exception as e:
            logger.error(f"Profile URL fetch error {discord_id}: {e}")
            import traceback

            logger.error(traceback.format_exc())
            return None


discord_service = DiscordBotService()
