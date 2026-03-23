import logging

from sqlalchemy.orm import Session

from dtos.val_stat_dto import AgentDto, GetValResponseDTO, ValStatDto
from entities.val_stat import ValStat


logger = logging.getLogger(__name__)


async def get_val_stat(
    user_id: int, db: Session
) -> GetValResponseDTO | None:
    """Get VAL data from database"""
    try:
        val_stat = db.query(ValStat).filter(ValStat.user_id == user_id).first()

        if not val_stat:
            logger.debug(f"No VAL data found for user {user_id}")
            return None

        agents = [
            AgentDto(
                name=agent.name,
                icon_url=agent.icon_url,
                games=agent.games,
                win_rate=agent.win_rate,
            )
            for agent in sorted(val_stat.agents, key=lambda x: x.rank_order)
        ]

        val_stat_dto = ValStatDto(
            tier=val_stat.tier, rank=val_stat.rank, top_agents=agents
        )

        return GetValResponseDTO(
            success=True,
            code=200,
            message="VAL info retrieved successfully.",
            data=val_stat_dto,
        )
    except Exception as e:
        logger.error(f"Failed to get VAL data for user {user_id}: {e}")
        return None
