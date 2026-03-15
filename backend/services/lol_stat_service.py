import logging

from sqlalchemy.orm import Session

from dtos.lol_stat_dto import ChampionDto, GetLolResponseDTO, LolStatDto
from entities.lol_stat import LolStat


logger = logging.getLogger(__name__)


async def get_lol_stat(user_id: int, db: Session) -> GetLolResponseDTO | None:
    try:
        lol_stat = db.query(LolStat).filter(LolStat.user_id == user_id).first()

        if not lol_stat:
            logger.debug(f"No LOL data found for user {user_id}")
            return None

        champions = [
            ChampionDto(
                name=champ.name,
                icon_url=champ.icon_url,
                games=champ.games,
                win_rate=champ.win_rate,
            )
            for champ in sorted(lol_stat.champions, key=lambda x: x.rank_order)
        ]

        lol_stat_dto = LolStatDto(
            tier=lol_stat.tier,
            rank=lol_stat.rank,
            lp=lol_stat.lp,
            top_champions=champions,
        )

        return GetLolResponseDTO(
            success=True,
            code=200,
            message="LOL info retrieved successfully.",
            data=lol_stat_dto,
        )
    except Exception as e:
        logger.error(f"Failed to get LOL data for user {user_id}: {e}")
        return None
