from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction_dto import AuctionDTO
from shared.utils.database import get_async_db

from ..services.auction_service import add_auction_service
from ..utils.token import Payload, verify_token


auction_router = APIRouter(prefix="/guild/{guild_id}/auction", tags=["auction"])


@auction_router.post("/{preset_id}", response_model=AuctionDTO)
async def add_auction_route(
    guild_id: int,
    preset_id: int,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
) -> AuctionDTO:
    return await add_auction_service(guild_id, preset_id, db, payload)
