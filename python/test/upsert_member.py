from __future__ import annotations

import argparse
import asyncio

from loguru import logger

from bot.utils.member import set_role, upsert_member
from shared.entities.member import Role
from shared.utils.database import get_session
from shared.utils.logging import setup_logging


setup_logging()


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upsert one test member")
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
            member = await upsert_member(
                args.guild_id,
                args.user_id,
                session,
                args.name,
                args.avatar_hash,
            )
            if role is not None:
                await set_role(args.guild_id, args.user_id, role, session)
            logger.info(
                "upsert_member done: "
                f"member_id={member.member_id} "
                f"guild_id={member.guild_id} user_id={member.user_id}"
            )
    except Exception as e:
        logger.exception(f"upsert_member error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
