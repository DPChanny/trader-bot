from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction_dto import AddAuctionDTO, AuctionDTO
from shared.utils.database import get_session

from ..services.auction_service import add_auction_service
from ..utils.token import verify_token


auction_router = APIRouter(
    prefix="/guild/{guild_id}/preset/{preset_id}/auction", tags=["auction"]
)


@auction_router.post("", response_model=AuctionDTO)
async def add_auction_route(
    guild_id: int,
    preset_id: int,
    dto: AddAuctionDTO,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
) -> AuctionDTO:
    return await add_auction_service(guild_id, discord_id, preset_id, dto, session)
