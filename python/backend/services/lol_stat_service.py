from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from shared.dtos.lol_stat_dto import ChampionDto, LolStatDto
from shared.entities.lol_stat import LolStat
from shared.entities.member import Member
from shared.utils.exception import service_exception_handler

from ..utils.role import get_guild_ids
from ..utils.token import Payload


@service_exception_handler
async def get_lol_stat(
    member_id: int, db: AsyncSession, payload: Payload
) -> LolStatDto:
    guild_ids = await get_guild_ids(payload.user_id, db)
    result = await db.execute(
        select(LolStat)
        .join(Member, LolStat.member_id == Member.member_id)
        .options(joinedload(LolStat.champions))
        .where(LolStat.member_id == member_id, Member.guild_id.in_(guild_ids))
    )
    lol_stat = result.unique().scalar_one_or_none()

    if lol_stat is None:
        logger.warning(f"LolStat not found: id={member_id}")
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
