from __future__ import annotations

import argparse
import asyncio

from bot.utils.guild import upsert_guild
from shared.utils.database import get_session


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upsert test guild")
    parser.add_argument("guild_id", type=int)
    parser.add_argument("name", type=str)
    parser.add_argument("--icon-hash", type=str, default=None)
    return parser.parse_args()


async def main() -> None:
    args = _parse_args()
    try:
        async for session in get_session():
            await upsert_guild(args.guild_id, args.name, args.icon_hash, session)
    except Exception:
        raise


if __name__ == "__main__":
    asyncio.run(main())
