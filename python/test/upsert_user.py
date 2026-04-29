import argparse
import asyncio

from shared.repositories.user_repository import UserRepository
from shared.utils.db import get_session


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
            await UserRepository(session).upsert(
                args.discord_id, args.name, args.avatar_hash
            )
    except Exception:
        raise


if __name__ == "__main__":
    asyncio.run(main())
