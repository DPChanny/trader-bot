import contextlib

from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction import (
    AuctionDTO,
    AuthEventPayloadDTO,
    BidDTO,
    PlaceBidEventPayloadDTO,
)
from shared.dtos.member import Role
from shared.dtos.preset import PresetDetailDTO
from shared.repositories.preset_member_repository import PresetMemberRepository
from shared.repositories.preset_repository import PresetRepository
from shared.utils.env import get_app_origin
from shared.utils.error import (
    AuctionErrorCode,
    HTTPError,
    PresetErrorCode,
    TokenError,
    ValidationErrorCode,
    WSError,
)
from shared.utils.service import Event, http_service, ws_service
from shared.utils.verify import Quota, get_quota, verify_role

from ..auction import Auction, AuctionManager
from ..utils.discord import send_channel_message
from ..utils.token import AccessToken


@http_service
async def create_auction_service(
    guild_id: int, user_id: int, preset_id: int, session: AsyncSession, event: Event
) -> AuctionDTO:
    event.input = {"guild_id": guild_id, "preset_id": preset_id}

    await verify_role(guild_id, user_id, session, Role.ADMIN)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_detail_by_id(preset_id, guild_id)

    if preset is None:
        raise HTTPError(PresetErrorCode.NotFound)

    ttl = await get_quota(guild_id, Quota.AUCTION_TTL, session)

    preset_members = preset.preset_members
    leaders = [pm for pm in preset_members if pm.is_leader]

    if len(leaders) < 2:
        raise HTTPError(ValidationErrorCode.Invalid)

    preset_snapshot = PresetDetailDTO.model_validate(preset)
    auction = await AuctionManager.create_auction(
        preset_snapshot=preset_snapshot, ttl=ttl
    )

    app_origin = get_app_origin()
    auction_url = (
        f"{app_origin}/guild/{guild_id}/preset/{preset_id}/auction/{auction.auction_id}"
    )
    invite_channel_id = preset.guild.invite_channel_id

    if invite_channel_id is not None:
        mentions = " ".join(f"<@{pm.member.user_id}>" for pm in preset_members)
        embed = [
            {
                "title": "Trader Bot 경매",
                "fields": [
                    {"name": "길드", "value": preset.guild.name, "inline": True},
                    {"name": "프리셋", "value": preset.name, "inline": True},
                    {"name": "참가 링크", "value": auction_url, "inline": False},
                ],
            }
        ]

        with contextlib.suppress(Exception):
            await send_channel_message(invite_channel_id, mentions, embed)

    return AuctionDTO(auction_id=auction.auction_id)


@ws_service
async def connect_service(
    ws: WebSocket,
    auction_id: int,
    dto: AuthEventPayloadDTO,
    session: AsyncSession,
    event: Event,
) -> tuple[Auction, int | None]:
    auction = await AuctionManager.get_auction(auction_id)

    if not auction:
        raise WSError(AuctionErrorCode.NotFound)

    access_token = dto.access_token

    member_id: int | None = None
    if access_token:
        try:
            user_id = AccessToken.decode(access_token).user_id
            pm = await PresetMemberRepository(session).get_by_user_id(
                user_id,
                auction.preset_snapshot.preset_id,
                auction.preset_snapshot.guild_id,
            )
            if pm is not None:
                member_id = pm.member_id
        except TokenError as e:
            raise WSError(e.code) from None

    await auction.connect(ws, member_id)

    event.input = {"auction_id": auction.auction_id}
    event.result = {"member_id": member_id}

    return auction, member_id


@ws_service
async def place_bid_service(
    auction: Auction, member_id: int | None, dto: PlaceBidEventPayloadDTO
) -> None:
    if member_id is None:
        raise WSError(AuctionErrorCode.BidNotLeader)

    await auction.place_bid(BidDTO(leader_id=member_id, amount=dto.amount))


@ws_service
async def disconnect_service(auction: Auction, ws: WebSocket) -> None:
    await auction.disconnect(ws)
