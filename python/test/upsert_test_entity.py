import asyncio

from sqlalchemy import select

from shared.dtos.member import Role
from shared.entities import Position, Preset, Tier
from shared.utils.db import get_session
from shared.utils.upsert import upsert_guild, upsert_member, upsert_user


TEST_GUILD_ID = 0
TEST_GUILD_NAME = "test guild"
TEST_USER_ID_START = 0
USER_COUNT = 10

TEST_PRESET_NAME = "test preset"
TEST_PRESET_POINTS = 200
TEST_PRESET_TIMER = 15
TEST_PRESET_TEAM_SIZE = 5
TEST_PRESET_POINT_SCALE = 5

TEST_POSITION_NAMES = [f"test position {i}" for i in range(5)]
TEST_TIER_NAMES = [f"test tier {i}" for i in range(5)]


def _role_for_index(index: int) -> Role:
    if index == 0:
        return Role.OWNER
    if index == 1:
        return Role.ADMIN
    if index == 2:
        return Role.EDITOR
    return Role.VIEWER


async def _upsert_preset(session, guild_id: int) -> Preset:
    preset = (
        await session.execute(
            select(Preset).where(
                Preset.guild_id == guild_id, Preset.name == TEST_PRESET_NAME
            )
        )
    ).scalar_one_or_none()

    if preset is None:
        preset = Preset(
            guild_id=guild_id,
            name=TEST_PRESET_NAME,
            points=TEST_PRESET_POINTS,
            timer=TEST_PRESET_TIMER,
            team_size=TEST_PRESET_TEAM_SIZE,
            point_scale=TEST_PRESET_POINT_SCALE,
        )
        session.add(preset)
        await session.flush()
        return preset

    preset.points = TEST_PRESET_POINTS
    preset.timer = TEST_PRESET_TIMER
    preset.team_size = TEST_PRESET_TEAM_SIZE
    preset.point_scale = TEST_PRESET_POINT_SCALE
    return preset


async def _upsert_positions(session, preset_id: int) -> int:
    existing_positions = (
        await session.execute(select(Position).where(Position.preset_id == preset_id))
    ).scalars()
    existing_by_name = {position.name: position for position in existing_positions}

    added_count = 0
    for name in TEST_POSITION_NAMES:
        if name in existing_by_name:
            continue
        session.add(Position(preset_id=preset_id, name=name, icon_url=None))
        added_count += 1

    if added_count > 0:
        await session.flush()
    return added_count


async def _upsert_tiers(session, preset_id: int) -> int:
    existing_tiers = (
        await session.execute(select(Tier).where(Tier.preset_id == preset_id))
    ).scalars()
    existing_by_name = {tier.name: tier for tier in existing_tiers}

    added_count = 0
    for name in TEST_TIER_NAMES:
        if name in existing_by_name:
            continue
        session.add(Tier(preset_id=preset_id, name=name, icon_url=None))
        added_count += 1

    if added_count > 0:
        await session.flush()
    return added_count


async def main() -> None:
    try:
        async for session in get_session():
            guild = await upsert_guild(
                guild_id=TEST_GUILD_ID,
                name=TEST_GUILD_NAME,
                icon_hash=None,
                session=session,
            )

            for i in range(USER_COUNT):
                user_id = TEST_USER_ID_START + i
                user_name = f"test user {i}"
                role = _role_for_index(i)

                await upsert_user(user_id, user_name, None, session)
                await upsert_member(
                    guild.discord_id, user_id, session, user_name, None, role
                )

            preset = await _upsert_preset(session, guild.discord_id)
            await _upsert_tiers(session, preset.preset_id)
            await _upsert_positions(session, preset.preset_id)
    except Exception:
        raise


if __name__ == "__main__":
    asyncio.run(main())
