import asyncio

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction_dto import (
    AuctionDTO,
    Team,
)
from shared.dtos.preset_dto import PresetDetailDTO
from shared.entities.member import Role
from shared.entities.preset_member import PresetMember
from shared.repositories.preset_repository import PresetRepository
from shared.utils.discord import send_message
from shared.utils.env import get_app_origin

from ..auction.auction_manager import auction_manager
from ..utils.exception import service_exception_handler
from ..utils.role import verify_role


@service_exception_handler
async def add_auction_service(
    guild_id: int, discord_id: int, preset_id: int, session: AsyncSession
) -> AuctionDTO:
    await verify_role(guild_id, discord_id, session, Role.ADMIN)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_detail_by_id(preset_id, guild_id)

    if preset is None:
        raise HTTPException(
            status_code=404, detail="Auction create failed: preset not found"
        )

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
    leader_member_ids: set[int] = set()
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
    preset_snapshot = PresetDetailDTO.model_validate(preset).model_dump(mode="json")

    auction = auction_manager.add_auction(
        teams=teams,
        member_ids=member_ids,
        leader_member_ids=leader_member_ids,
        preset_snapshot=preset_snapshot,
        timer=preset.timer,
        team_size=preset.team_size,
    )
    auction_id: str = auction.auction_id

    logger.info(
        f"Auction created: auction_id={auction_id}, member_count={len(member_ids)}"
    )

    app_origin = get_app_origin()

    async def _send_dm(pm: PresetMember):
        member = pm.member
        if member is None:
            return
        role_label = "팀장" if pm.is_leader else "선수"
        auction_url = f"{app_origin}/auction/{auction_id}"
        embed = [
            {
                "title": "Trader 경매",
                "fields": [
                    {
                        "name": "서버",
                        "value": preset.guild.name,
                        "inline": True,
                    },
                    {
                        "name": "프리셋",
                        "value": preset.name,
                        "inline": True,
                    },
                    {
                        "name": "역할",
                        "value": role_label,
                        "inline": True,
                    },
                    {
                        "name": "참가 링크",
                        "value": auction_url,
                        "inline": False,
                    },
                ],
            }
        ]
        await send_message(member.discord_user_id, embed)

    await asyncio.gather(
        *[_send_dm(pm) for pm in preset_members],
        return_exceptions=True,
    )

    return AuctionDTO(auction_id=auction_id)
