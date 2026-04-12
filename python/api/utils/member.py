from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.member import Role
from shared.repositories.member_repository import MemberRepository
from shared.utils.error import AppError, Member


async def verify_role(
    guild_id: int,
    user_id: int,
    db: AsyncSession,
    min_role: Role = Role.VIEWER,
) -> Role:
    member_repo = MemberRepository(db)
    member = await member_repo.get_by_user_id(user_id, guild_id)
    if member is None:
        raise AppError(Member.NotFound)
    if Role(member.role) < min_role:
        raise AppError(Member.InsufficientRole)
    return Role(member.role)
