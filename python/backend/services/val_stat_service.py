from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from shared.dtos.val_stat_dto import AgentDto, ValStatDto
from shared.entities.member import Member
from shared.entities.val_stat import ValStat
from shared.utils.exception import service_exception_handler

from ..utils.role import get_guild_ids
from ..utils.token import Payload


@service_exception_handler
async def get_val_stat(
    member_id: int, db: AsyncSession, payload: Payload
) -> ValStatDto:
    guild_ids = await get_guild_ids(payload.user_id, db)
    result = await db.execute(
        select(ValStat)
        .join(Member, ValStat.member_id == Member.member_id)
        .options(joinedload(ValStat.agents))
        .where(ValStat.member_id == member_id, Member.guild_id.in_(guild_ids))
    )
    val_stat = result.unique().scalar_one_or_none()

    if val_stat is None:
        logger.warning(f"ValStat not found: id={member_id}")
        raise HTTPException(
            status_code=404,
            detail="ValStat not found",
        )

    agents = [
        AgentDto(
            name=agent.name,
            icon_url=agent.icon_url,
            games=agent.games,
            win_rate=agent.win_rate,
        )
        for agent in sorted(val_stat.agents, key=lambda x: x.rank_order)
    ]

    return ValStatDto(tier=val_stat.tier, rank=val_stat.rank, top_agents=agents)
