from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.dtos.auction_dto import AuctionDTO
from shared.utils.database import get_db

from ..services.auction_service import add_auction_service
from ..utils.token import verify_token


auction_router = APIRouter(prefix="/auction", tags=["auction"])


@auction_router.post("/{preset_id}", response_model=AuctionDTO)
async def add_auction_route(
    preset_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token),
) -> AuctionDTO:
    return await add_auction_service(preset_id, db)
