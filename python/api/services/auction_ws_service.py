from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction import (
    AuthPayloadDTO,
    PlaceBidPayloadDTO,
)
from shared.repositories.preset_member_repository import PresetMemberRepository
from shared.utils.error import (
    AuctionErrorCode,
    AuthErrorCode,
    TokenError,
    WSError,
)
from shared.utils.service import ws_service

from ..auction import Auction, AuctionManager
from ..utils.token import AccessToken


@ws_service
async def connect_service(
    ws: WebSocket,
    auction_id: int,
    auth_payload_dto: AuthPayloadDTO,
    session: AsyncSession,
    event: dict,
) -> tuple[Auction, int | None, int | None]:
    auction = AuctionManager.get_auction(auction_id)

    if not auction:
        raise WSError(AuctionErrorCode.NotFound)

    token = auth_payload_dto.token

    member_id: int | None = None
    if token:
        try:
            user_id = AccessToken.decode(token).user_id
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

    event |= {"auction_id": auction_id, "member_id": member_id}

    await auction.connect(ws, member_id)

    return auction, member_id, team_id


@ws_service
async def place_bid_service(
    auction: Auction,
    member_id: int | None,
    place_bid_payload_dto: PlaceBidPayloadDTO,
    event: dict,
) -> None:
    if member_id is None:
        raise WSError(AuthErrorCode.Unauthorized)

    await auction.place_bid(member_id, place_bid_payload_dto.amount)

    event |= {"member_id": member_id, "amount": place_bid_payload_dto.amount}


@ws_service
async def disconnect_service(
    auction: Auction,
    member_id: int | None,
    ws: WebSocket,
    event: dict,
) -> None:
    await auction.disconnect(ws, member_id)
    event |= {"member_id": member_id}
