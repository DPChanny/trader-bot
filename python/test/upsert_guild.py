from __future__ import annotations

import argparse
import asyncio

from loguru import logger

from bot.utils.guild import upsert_guild
from shared.utils.database import get_session
from shared.utils.logging import setup_logging


setup_logging()


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upsert one test guild")
    parser.add_argument("guild_id", type=int)
    parser.add_argument("name", type=str)
    parser.add_argument("--icon-hash", type=str, default=None)
    return parser.parse_args()


async def main() -> None:
    args = _parse_args()
    try:
        async for session in get_session():
            guild = await upsert_guild(
                args.guild_id,
                args.name,
                args.icon_hash,
                session,
            )
            logger.info(
                f"upsert_guild done: guild_id={guild.discord_id} name={guild.name}"
            )
    except Exception as e:
        logger.exception(f"upsert_guild error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
