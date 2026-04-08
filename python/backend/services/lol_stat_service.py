from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from shared.dtos.lol_stat_dto import ChampionDTO, LolStatDTO
from shared.entities.lol_stat import LolStat

from ..utils.exception import service_exception_handler


@service_exception_handler
async def get_lol_stat(member_id: int, db: AsyncSession) -> LolStatDTO:
    result = await db.execute(
        select(LolStat)
        .options(joinedload(LolStat.champions))
        .where(LolStat.member_id == member_id)
    )
    lol_stat = result.unique().scalar_one_or_none()

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
