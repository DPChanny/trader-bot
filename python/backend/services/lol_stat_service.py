import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from shared.dtos.lol_stat_dto import ChampionDto, LolStatDto
from shared.entities.lol_stat import LolStat

from ..utils.exception import service_exception_handler


logger = logging.getLogger(__name__)


@service_exception_handler
async def get_lol_stat(user_id: int, db: Session) -> LolStatDto:
    lol_stat = db.query(LolStat).filter(LolStat.user_id == user_id).first()

    if lol_stat is None:
        logger.warning(f"Missing: {user_id}")
        raise HTTPException(
            status_code=404,
            detail="LOL info not found. Please wait for crawler to update data.",
        )

    champions = [
        ChampionDto(
            name=champ.name,
            icon_url=champ.icon_url,
            games=champ.games,
            win_rate=champ.win_rate,
        )
        for champ in sorted(lol_stat.champions, key=lambda x: x.rank_order)
    ]

    return LolStatDto(
        tier=lol_stat.tier,
        rank=lol_stat.rank,
        lp=lol_stat.lp,
        top_champions=champions,
    )
