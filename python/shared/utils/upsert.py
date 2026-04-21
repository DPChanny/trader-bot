from sqlalchemy.ext.asyncio import AsyncSession

from ..dtos.guild import GuildDTO
from ..dtos.member import MemberDTO, Role
from ..dtos.user import UserDTO
from ..entities import Guild, Member, User
from ..repositories.guild_repository import GuildRepository
from ..repositories.member_repository import MemberRepository
from ..repositories.user_repository import UserRepository


async def upsert_user(
    discord_id: int, name: str, avatar_hash: str | None, session: AsyncSession
) -> UserDTO:
    repo = UserRepository(session)
    entity = await repo.get_by_id(discord_id)
    if entity is None:
        session.add(User(discord_id=discord_id, name=name, avatar_hash=avatar_hash))
        await session.flush()
        entity = await repo.get_by_id(discord_id)
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash

    return UserDTO.model_validate(entity)


async def upsert_member(
    guild_id: int,
    user_id: int,
    session: AsyncSession,
    name: str | None = None,
    avatar_hash: str | None = None,
    role: Role | None = None,
) -> MemberDTO:
    repo = MemberRepository(session)
    entity = await repo.get_by_user_id(user_id, guild_id)
    if entity is None:
        entity = Member(
            guild_id=guild_id,
            user_id=user_id,
            role=role if role is not None else Role.VIEWER,
            name=name,
            avatar_hash=avatar_hash,
        )
        session.add(entity)
        await session.flush()
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash
        if role is not None:
            entity.role = role

    return MemberDTO.model_validate(entity)


async def upsert_guild(
    guild_id: int, name: str, icon_hash: str | None, session: AsyncSession
) -> GuildDTO:
    repo = GuildRepository(session)
    entity = await repo.get_by_id(guild_id)
    if entity is None:
        entity = Guild(discord_id=guild_id, name=name, icon_hash=icon_hash)
        session.add(entity)
        await session.flush()
    else:
        entity.name = name
        entity.icon_hash = icon_hash

    return GuildDTO.model_validate(entity)
