import argparse
import asyncio

from shared.dtos.member import Role
from shared.repositories.member_repository import MemberRepository
from shared.utils.db import get_session


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upsert test member")
    parser.add_argument("guild_id", type=int)
    parser.add_argument("user_id", type=int)
    parser.add_argument("--name", type=str, default=None)
    parser.add_argument("--avatar-hash", type=str, default=None)
    parser.add_argument("--role", type=int, choices=[0, 1, 2, 3], default=None)
    return parser.parse_args()


async def main() -> None:
    args = _parse_args()
    role = Role(args.role) if args.role is not None else None
    try:
        async for session in get_session():
            await MemberRepository(session).upsert(
                args.guild_id,
                args.user_id,
                args.name,
                args.avatar_hash,
                role if role is not None else Role.VIEWER,
            )
    except Exception:
        raise


if __name__ == "__main__":
    asyncio.run(main())
