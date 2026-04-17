import asyncio

from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction import (
    AuctionDTO,
    AuthPayloadDTO,
    CreateAuctionDTO,
    PlaceBidPayloadDTO,
)
from shared.dtos.member import Role
from shared.dtos.preset import PresetDetailDTO
from shared.entities.preset_member import PresetMember
from shared.repositories.preset_member_repository import PresetMemberRepository
from shared.repositories.preset_repository import PresetRepository
from shared.utils.env import get_app_origin
from shared.utils.error import (
    AuctionErrorCode,
    HTTPError,
    PresetErrorCode,
    TokenError,
    WSError,
)
from shared.utils.service import Event, http_service, set_event_response, ws_service

from ..auction import Auction, AuctionManager
from ..utils.discord import send_message
from ..utils.member import verify_role
from ..utils.token import AccessToken


@http_service
async def create_auction_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: CreateAuctionDTO,
    session: AsyncSession,
    event: Event,
) -> AuctionDTO:
    await verify_role(guild_id, user_id, session, Role.ADMIN)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_detail_by_id(preset_id, guild_id)

    if preset is None:
        raise HTTPError(PresetErrorCode.NotFound)

    preset_members = preset.preset_members
    leaders = [pm for pm in preset_members if pm.is_leader]

    if len(leaders) < 2:
        raise HTTPError(AuctionErrorCode.InsufficientLeaders)

    preset_snapshot = PresetDetailDTO.model_validate(preset)
    auction = AuctionManager.create_auction(
        preset_snapshot=preset_snapshot,
        is_public=dto.is_public,
    )

    app_origin = get_app_origin()
    auction_url = f"{app_origin}/auction/{auction.auction_id}"

    async def _send_invite(pm: PresetMember):
        try:
            member = pm.member
            role = "팀장" if pm.is_leader else "선수"
            embed = [
                {
                    "title": "Trader 경매",
                    "fields": [
                        {
                            "name": "길드",
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
        except Exception:
            pass

    if dto.send_invite:
        await asyncio.gather(
            *[_send_invite(pm) for pm in preset_members],
        )

    response = AuctionDTO.model_validate(auction)
    return set_event_response(event, response)


@ws_service
async def connect_service(
    ws: WebSocket,
    auction_id: int,
    dto: AuthPayloadDTO,
    session: AsyncSession,
) -> tuple["Auction", int | None, int | None]:
    auction = AuctionManager.get_auction(auction_id)

    if not auction:
        raise WSError(AuctionErrorCode.NotFound)

    access_token = dto.access_token

    member_id: int | None = None
    if access_token:
        try:
            user_id = AccessToken.decode(access_token).user_id
            pm = await PresetMemberRepository(session).get_by_user_id(
                user_id, auction.preset_id, auction.guild_id
            )
            if pm is not None:
                member_id = pm.member_id
        except TokenError as e:
            raise WSError(e.code) from None

    team_id: int | None = None
    if member_id is not None:
        for team in auction.teams:
            if team.leader_id == member_id:
                team_id = team.team_id
                break

    if member_id is None and not auction.is_public:
        raise WSError(AuctionErrorCode.ForbiddenAccess)

    await auction.connect(ws, member_id)

    return auction, member_id, team_id


@ws_service
async def place_bid_service(
    auction: Auction,
    member_id: int | None,
    dto: PlaceBidPayloadDTO,
) -> None:
    if member_id is None:
        raise WSError(AuctionErrorCode.BidNotLeader)

    await auction.place_bid(member_id, dto.amount)


@ws_service
async def disconnect_service(
    auction: Auction,
    member_id: int | None,
    ws: WebSocket,
) -> None:
    await auction.disconnect(ws, member_id)
