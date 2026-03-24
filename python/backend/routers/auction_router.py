from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.dtos.auction_dto import AuctionDTO

from ..services.auction_service import add_auction_service
from ..utils.auth import verify_admin_token


auction_router = APIRouter(prefix="/auction", tags=["auction"])


@auction_router.post("/{preset_id}", response_model=AuctionDTO)
async def add_auction_route(
    preset_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
) -> AuctionDTO:
    return add_auction_service(preset_id, db)
