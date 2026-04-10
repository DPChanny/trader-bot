from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.lol_stat_dto import ChampionDTO, LolStatDTO
from shared.repositories.lol_stat_repository import LolStatRepository

from ..utils.exception import service_exception_handler


@service_exception_handler
async def get_lol_stat(member_id: int, db: AsyncSession) -> LolStatDTO:
    lol_stat_repo = LolStatRepository(db)
    lol_stat = await lol_stat_repo.get_by_member_id(member_id)

    if lol_stat is None:
        raise HTTPException(
            status_code=404,
            detail="LolStat not found",
        )

    champions = [
        ChampionDTO(
            name=champ.name,
            icon_url=champ.icon_url,
            games=champ.games,
            win_rate=champ.win_rate,
        )
        for champ in sorted(lol_stat.champions, key=lambda x: x.rank_order)
    ]

    return LolStatDTO(
        tier=lol_stat.tier,
        rank=lol_stat.rank,
        lp=lol_stat.lp,
        top_champions=champions,
    )
