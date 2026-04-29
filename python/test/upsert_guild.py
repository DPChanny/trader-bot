import argparse
import asyncio

from shared.repositories.guild_repository import GuildRepository
from shared.utils.db import get_session


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
            await GuildRepository(session).upsert(
                args.guild_id, args.name, args.icon_hash
            )
    except Exception:
        raise


if __name__ == "__main__":
    asyncio.run(main())
