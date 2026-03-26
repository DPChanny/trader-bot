from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session, joinedload

from shared.dtos.auction_dto import (
    AuctionDTO,
    Team,
)
from shared.entities.manager import Role
from shared.entities.member import Member
from shared.entities.preset import Preset
from shared.entities.preset_member import PresetMember
from shared.utils.env import get_auction_url
from shared.utils.exception import service_exception_handler

from ..auction.auction_manager import auction_manager
from ..utils.bot import invite
from ..utils.role import get_guild_ids, verify_role
from ..utils.token import Payload


@service_exception_handler
async def add_auction_service(
    preset_id: int, db: Session, payload: Payload
) -> AuctionDTO:
    guild_ids = get_guild_ids(payload.user_id, db)
    preset = (
        db.query(Preset)
        .options(
            joinedload(Preset.preset_members).joinedload(PresetMember.member),
        )
        .filter(Preset.preset_id == preset_id, Preset.guild_id.in_(guild_ids))
        .first()
    )

    if preset is None:
        logger.warning(
            f"Auction create failed: reason=preset_not_found, preset_id={preset_id}"
        )
        raise HTTPException(status_code=404, detail="Auction create failed")

    verify_role(preset.guild_id, payload.user_id, Role.EDITOR, db)

    preset_members = preset.preset_members
    if not preset_members:
        logger.warning(f"Auction create failed: reason=no_users, preset_id={preset_id}")
        raise HTTPException(status_code=400, detail="Auction create failed")

    leaders = [pm for pm in preset_members if pm.is_leader]
    if not leaders:
        logger.warning(
            f"Auction create failed: reason=no_leaders, preset_id={preset_id}"
        )
        raise HTTPException(status_code=400, detail="Auction create failed")

    if len(leaders) < 2:
        logger.warning(
            f"Auction create failed: reason=insufficient_leaders, count={len(leaders)}, required=2"
        )
        raise HTTPException(
            status_code=400,
            detail="Auction create failed",
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
            member = db.query(Member).filter(Member.member_id == member_id).first()

            if member is None:
                logger.warning(
                    f"Auction setup warning: reason=member_not_found, member_id={member_id}"
                )
                continue

            auction_url = get_auction_url(token)
            if member.discord_id is not None:
                invites.append((member.discord_id, auction_url))

    if invites:
        await invite(invites)

    return AuctionDTO(
        auction_id=auction_id,
        preset_id=preset_id,
    )
