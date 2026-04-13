import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction_dto import (
    AuctionDTO,
    CreateAuctionDTO,
)
from shared.dtos.preset_dto import PresetDetailDTO
from shared.entities.member import Role
from shared.entities.preset_member import PresetMember
from shared.repositories.preset_repository import PresetRepository
from shared.utils.env import get_app_origin
from shared.utils.error import AppError, AuctionErrorCode, PresetErrorCode
from shared.utils.service import service

from ..auction.auction_manager import auction_manager
from ..utils.discord import send_message
from ..utils.member import verify_role


@service
async def create_auction_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: CreateAuctionDTO,
    session: AsyncSession,
    event,
) -> AuctionDTO:
    await verify_role(guild_id, user_id, session, Role.ADMIN)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_detail_by_id(preset_id, guild_id)

    if preset is None:
        raise AppError(PresetErrorCode.NotFound)

    preset_members = preset.preset_members
    leaders = [pm for pm in preset_members if pm.is_leader]

    if len(leaders) < 2:
        raise AppError(AuctionErrorCode.InsufficientLeaders)

    preset_snapshot = PresetDetailDTO.model_validate(preset)
    auction = auction_manager.create_auction(
        preset_snapshot=preset_snapshot,
        allow_public=dto.allow_public,
    )
    auction_id: int = auction.auction_id

    result = AuctionDTO(auction_id=auction_id)
    event |= result.model_dump() | {
        "preset_id": preset_snapshot.preset_id,
        "guild_id": preset_snapshot.guild_id,
    }

    app_origin = get_app_origin()

    async def _send_invite(pm: PresetMember):
        member = pm.member
        if member is None:
            return
        role = "팀장" if pm.is_leader else "선수"
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
                        "value": role,
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
        await send_message(member.user_id, embed)

    if dto.send_invite:
        await asyncio.gather(
            *[_send_invite(pm) for pm in preset_members],
            return_exceptions=True,
        )

    return result
