import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from shared.dtos.val_stat_dto import AgentDto, ValStatDto
from shared.entities.val_stat import ValStat

from ..utils.exception import service_exception_handler


logger = logging.getLogger(__name__)


@service_exception_handler
async def get_val_stat(user_id: int, db: Session) -> ValStatDto:
    val_stat = db.query(ValStat).filter(ValStat.user_id == user_id).first()

    if val_stat is None:
        logger.warning(f"Missing: {user_id}")
        raise HTTPException(
            status_code=404,
            detail="VAL info not found. Please wait for crawler to update data.",
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
