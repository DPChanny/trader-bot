from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session, joinedload

from shared.dtos.val_stat_dto import AgentDto, ValStatDto
from shared.entities.member import Member
from shared.entities.val_stat import ValStat
from shared.utils.exception import service_exception_handler

from ..utils.role import get_guild_ids
from ..utils.token import Payload


@service_exception_handler
async def get_val_stat(member_id: int, db: Session, payload: Payload) -> ValStatDto:
    guild_ids = get_guild_ids(payload.user_id, db)
    val_stat = (
        db.query(ValStat)
        .join(Member, ValStat.member_id == Member.member_id)
        .options(joinedload(ValStat.agents))
        .filter(ValStat.member_id == member_id, Member.guild_id.in_(guild_ids))
        .first()
    )

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
