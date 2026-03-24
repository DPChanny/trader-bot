from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session, joinedload

from shared.dtos.lol_stat_dto import ChampionDto, LolStatDto
from shared.entities.lol_stat import LolStat

from ..utils.exception import service_exception_handler


@service_exception_handler
async def get_lol_stat(user_id: int, db: Session) -> LolStatDto:
    lol_stat = (
        db.query(LolStat)
        .options(joinedload(LolStat.champions))
        .filter(LolStat.user_id == user_id)
        .first()
    )

    if lol_stat is None:
        logger.warning(f"LolStat not found: id={user_id}")
        raise HTTPException(
            status_code=404,
            detail="LolStat not found",
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
