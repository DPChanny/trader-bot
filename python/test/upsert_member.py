from __future__ import annotations

import argparse
import asyncio

from shared.dtos.member import Role
from shared.utils.db import get_session
from shared.utils.upsert import upsert_member


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
            await upsert_member(
                args.guild_id, args.user_id, session, args.name, args.avatar_hash, role
            )
    except Exception:
        raise


if __name__ == "__main__":
    asyncio.run(main())
