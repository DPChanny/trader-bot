from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild_dto import GuildDetailDTO
from shared.entities.guild import Guild
from shared.entities.member import Member

from ..utils.exception import service_exception_handler
from ..utils.role import verify_role
from ..utils.token import Payload


async def _query_guild_detail(guild_id: int, db: AsyncSession) -> Guild | None:
    result = await db.execute(select(Guild).where(Guild.guild_id == guild_id))
    return result.scalar_one_or_none()


@service_exception_handler
async def get_guild_list_service(
    db: AsyncSession, payload: Payload
) -> list[GuildDetailDTO]:
    result = await db.execute(
        select(Guild)
        .join(Member, Member.guild_id == Guild.guild_id)
        .where(
            Member.discord_id == payload.discord_id,
        )
    )
    guilds = result.unique().scalars().all()
    return [GuildDetailDTO.model_validate(g) for g in guilds]


@service_exception_handler
async def get_guild_detail_service(
    guild_id: int, db: AsyncSession, payload: Payload
) -> GuildDetailDTO:
    await verify_role(guild_id, payload.discord_id, db)

    guild = await _query_guild_detail(guild_id, db)
    if guild is None:
        raise HTTPException(status_code=404, detail="Guild not found")

    return GuildDetailDTO.model_validate(guild)
