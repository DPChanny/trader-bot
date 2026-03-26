from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session, joinedload

from shared.dtos.auction_dto import (
    AuctionDTO,
    Team,
)
from shared.entities.guild_manager import GuildRole
from shared.entities.preset import Preset
from shared.entities.preset_user import PresetUser
from shared.entities.user import User
from shared.utils.env import get_auction_url
from shared.utils.exception import service_exception_handler

from ..auction.auction_manager import auction_manager
from ..utils.bot import invite
from ..utils.guild_permission import get_accessible_guild_ids, require_guild_role
from ..utils.token import Payload


@service_exception_handler
async def add_auction_service(
    preset_id: int, db: Session, payload: Payload
) -> AuctionDTO:
    guild_ids = get_accessible_guild_ids(payload.manager_id, db)
    preset = (
        db.query(Preset)
        .options(
            joinedload(Preset.preset_users).joinedload(PresetUser.user),
        )
        .filter(Preset.preset_id == preset_id, Preset.guild_id.in_(guild_ids))
        .first()
    )

    if preset is None:
        logger.warning(
            f"Auction create failed: reason=preset_not_found, preset_id={preset_id}"
        )
        raise HTTPException(status_code=404, detail="Auction create failed")

    require_guild_role(preset.guild_id, payload.manager_id, GuildRole.EDITOR, db)

    preset_users = preset.preset_users
    if not preset_users:
        logger.warning(f"Auction create failed: reason=no_users, preset_id={preset_id}")
        raise HTTPException(status_code=400, detail="Auction create failed")

    leaders = [pu for pu in preset_users if pu.is_leader]
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
    leader_user_ids = set()
    for idx, leader in enumerate(leaders):
        team = Team(
            team_id=idx + 1,
            leader_id=leader.user_id,
            member_id_list=[leader.user_id],
            points=preset.points,
        )
        teams.append(team)
        leader_user_ids.add(leader.user_id)

    user_ids = [preset_user.user_id for preset_user in preset_users]

    auction_id, user_tokens = auction_manager.add_auction(
        preset_id=preset_id,
        teams=teams,
        user_ids=user_ids,
        leader_user_ids=leader_user_ids,
        time=preset.time,
    )

    logger.info(f"Auction created: auction_id={auction_id}, user_count={len(user_ids)}")

    invites = []
    for user_id in user_ids:
        if user_id in user_tokens:
            token = user_tokens[user_id]
            user = db.query(User).filter(User.user_id == user_id).first()

            if user is None:
                logger.warning(
                    f"Auction setup warning: reason=user_not_found, user_id={user_id}"
                )
                continue

            auction_url = get_auction_url(token)
            if user.discord_id is not None:
                invites.append((user.discord_id, auction_url))

    if invites:
        await invite(invites)

    return AuctionDTO(
        auction_id=auction_id,
        preset_id=preset_id,
    )
