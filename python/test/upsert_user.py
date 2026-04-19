from __future__ import annotations

import argparse
import asyncio

from shared.utils.db import get_session
from shared.utils.user import upsert_user


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upsert test user")
    parser.add_argument("discord_id", type=int)
    parser.add_argument("name", type=str)
    parser.add_argument("--avatar-hash", type=str, default=None)
    return parser.parse_args()


async def main() -> None:
    args = _parse_args()
    try:
        async for session in get_session():
            await upsert_user(args.discord_id, args.name, args.avatar_hash, session)
    except Exception:
        raise


if __name__ == "__main__":
    asyncio.run(main())
