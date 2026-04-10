from fastapi import HTTPException

from shared.entities.member import Role
from shared.repositories.member_repository import MemberRepository


async def verify_role(
    guild_id: int,
    discord_user_id: int,
    member_repo: MemberRepository,
    min_role: Role = Role.VIEWER,
) -> Role:
    member = await member_repo.get_by_discord_user_id(discord_user_id, guild_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Guild not found")
    if member.role < min_role:
        raise HTTPException(status_code=403, detail="Insufficient guild permissions")
    return Role(member.role)
