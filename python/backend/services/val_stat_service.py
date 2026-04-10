from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.val_stat_dto import AgentDTO, ValStatDTO
from shared.repositories.val_stat_repository import ValStatRepository

from ..utils.exception import service_exception_handler


@service_exception_handler
async def get_val_stat(member_id: int, db: AsyncSession) -> ValStatDTO:
    val_stat_repo = ValStatRepository(db)
    val_stat = await val_stat_repo.get_by_member_id(member_id)

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
