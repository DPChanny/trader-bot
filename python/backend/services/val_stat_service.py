from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from shared.dtos.val_stat_dto import AgentDTO, ValStatDTO
from shared.entities.val_stat import ValStat

from ..utils.exception import service_exception_handler


@service_exception_handler
async def get_val_stat(member_id: int, db: AsyncSession) -> ValStatDTO:
    result = await db.execute(
        select(ValStat)
        .options(joinedload(ValStat.agents))
        .where(ValStat.member_id == member_id)
    )
    val_stat = result.unique().scalar_one_or_none()

    if val_stat is None:
        raise HTTPException(
            status_code=404,
            detail="ValStat not found",
        )

    agents = [
        AgentDTO(
            name=agent.name,
            icon_url=agent.icon_url,
            games=agent.games,
            win_rate=agent.win_rate,
        )
        for agent in sorted(val_stat.agents, key=lambda x: x.rank_order)
    ]

    return ValStatDTO(tier=val_stat.tier, rank=val_stat.rank, top_agents=agents)
