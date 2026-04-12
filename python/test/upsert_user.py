from __future__ import annotations

import argparse
import asyncio

from loguru import logger

from shared.utils.database import get_session
from shared.utils.logging import setup_logging
from shared.utils.user import upsert_user


setup_logging()


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upsert one test user")
    parser.add_argument("discord_id", type=int)
    parser.add_argument("name", type=str)
    parser.add_argument("--avatar-hash", type=str, default=None)
    return parser.parse_args()


async def main() -> None:
    args = _parse_args()
    try:
        async for session in get_session():
            await upsert_user(args.discord_id, args.name, args.avatar_hash, session)
            logger.info(
                f"upsert_user done: discord_id={args.discord_id} name={args.name}"
            )
    except Exception as e:
        logger.exception(f"upsert_user error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
