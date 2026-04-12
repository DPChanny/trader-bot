from __future__ import annotations

import asyncio

from bot.utils.guild import upsert_guild
from bot.utils.member import set_role, upsert_member
from shared.entities.member import Role
from shared.utils.database import _sessionmaker
from shared.utils.user import upsert_user


TEST_GUILD_DISCORD_ID = 0
TEST_GUILD_NAME = "test_guild"

USERS: list[dict[str, int | str | Role]] = [
    {
        "discord_id": 0,
        "name": "test_owner",
        "role": Role.OWNER,
    },
    {
        "discord_id": 1,
        "name": "test_admin_1",
        "role": Role.ADMIN,
    },
    {
        "discord_id": 2,
        "name": "test_editor_1",
        "role": Role.EDITOR,
    },
] + [
    {
        "discord_id": 3 + i,
        "name": f"test_viewer_{i + 1}",
        "role": Role.VIEWER,
    }
    for i in range(7)
]


async def main() -> None:
    async with _sessionmaker() as session:
        try:
            guild = await upsert_guild(
                guild_id=TEST_GUILD_DISCORD_ID,
                name=TEST_GUILD_NAME,
                icon_hash=None,
                session=session,
            )
            for user in USERS:
                discord_id = int(user["discord_id"])
                name = str(user["name"])
                role = user["role"]

                await upsert_user(discord_id, name, None, session)
                await upsert_member(
                    guild_id=guild.discord_id,
                    user_id=discord_id,
                    session=session,
                    name=name,
                    avatar_hash=None,
                )
                await set_role(
                    guild_id=guild.discord_id,
                    user_id=discord_id,
                    role=role,
                    session=session,
                )

            await session.commit()

        except Exception:
            await session.rollback()
            raise

    print("✅ Dummy entities seeded successfully")
    print(f"  Guild: {TEST_GUILD_NAME} ({TEST_GUILD_DISCORD_ID})")
    print(f"  Users: {len(USERS)} (1 OWNER, 1 ADMIN, 1 EDITOR, 7 VIEWER)")


if __name__ == "__main__":
    asyncio.run(main())
