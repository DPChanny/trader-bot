import asyncio

from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from shared.dtos.auction_dto import (
    AuctionDTO,
    Team,
)
from shared.entities.manager import Role
from shared.entities.member import Member
from shared.entities.preset import Preset
from shared.entities.preset_member import PresetMember
from shared.utils.env import get_app_origin
from shared.utils.exception import service_exception_handler

from ..auction.auction_manager import auction_manager
from ..utils.discord import send_message
from ..utils.role import get_guild_ids, verify_role
from ..utils.token import Payload


@service_exception_handler
async def add_auction_service(
    preset_id: int, db: AsyncSession, payload: Payload
) -> AuctionDTO:
    guild_ids = await get_guild_ids(payload.discord_id, db)
    result = await db.execute(
        select(Preset)
        .options(
            joinedload(Preset.preset_members).joinedload(PresetMember.member),
        )
        .where(Preset.preset_id == preset_id, Preset.guild_id.in_(guild_ids))
    )
    preset = result.unique().scalar_one_or_none()

    if preset is None:
        raise HTTPException(
            status_code=404, detail="Auction create failed: preset not found"
        )

    await verify_role(preset.guild_id, payload.discord_id, Role.EDITOR, db)

    preset_members = preset.preset_members
    if not preset_members:
        raise HTTPException(status_code=400, detail="Auction create failed: no members")

    leaders = [pm for pm in preset_members if pm.is_leader]
    if not leaders:
        raise HTTPException(status_code=400, detail="Auction create failed: no leaders")

    if len(leaders) < 2:
        raise HTTPException(
            status_code=400,
            detail="Auction create failed: at least 2 leaders required",
        )

    teams = []
    leader_member_ids = set()
    for idx, leader in enumerate(leaders):
        team = Team(
            team_id=idx + 1,
            leader_id=leader.member_id,
            member_id_list=[leader.member_id],
            points=preset.points,
        )
        teams.append(team)
        leader_member_ids.add(leader.member_id)

    member_ids = [pm.member_id for pm in preset_members]

    auction_id, user_tokens = auction_manager.add_auction(
        preset_id=preset_id,
        teams=teams,
        user_ids=member_ids,
        leader_user_ids=leader_member_ids,
        time=preset.time,
    )

    logger.info(
        f"Auction created: auction_id={auction_id}, member_count={len(member_ids)}"
    )

    invites = []
    for member_id in member_ids:
        if member_id in user_tokens:
            token = user_tokens[member_id]
            member_result = await db.execute(
                select(Member).where(Member.member_id == member_id)
            )
            member = member_result.scalar_one_or_none()

            if member is None:
                logger.warning(
                    f"Auction setup warning: reason=member_not_found, member_id={member_id}"
                )
                continue

            auction_url = f"{get_app_origin()}/auction?token={token}"
            if member.discord_id is not None:
                invites.append((member.discord_id, auction_url))

    if invites:

        def embed(url):
            return [
                {
                    "title": "Trader 경매",
                    "fields": [{"name": "참가 링크", "value": url, "inline": False}],
                }
            ]

        await asyncio.gather(
            *[send_message(discord_id, embed(url)) for discord_id, url in invites],
            return_exceptions=True,
        )

    return AuctionDTO(
        auction_id=auction_id,
        preset_id=preset_id,
    )
