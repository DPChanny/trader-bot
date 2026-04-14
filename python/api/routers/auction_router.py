from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction import AuctionDTO, CreateAuctionDTO
from shared.utils.database import get_session

from ..services.auction_service import create_auction_service
from ..utils.token import verify_access_token


auction_router = APIRouter(
    prefix="/guild/{guild_id}/preset/{preset_id}/auction", tags=["auction"]
)


@auction_router.post("", response_model=AuctionDTO)
async def create_auction_route(
    guild_id: int,
    preset_id: int,
    dto: CreateAuctionDTO,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
) -> AuctionDTO:
    return await create_auction_service(guild_id, user_id, preset_id, dto, session)
