import asyncio
import uuid
from time import time

from shared.dtos.preset_dto import PresetDetailDTO

from .auction import Auction, AuctionStatus


class AuctionManager:
    def __init__(self):
        self.auctions: dict[int, Auction] = {}

    def _purge(self) -> None:
        now = time()
        for auction_id, auction in list(self.auctions.items()):
            if auction.status == AuctionStatus.COMPLETED:
                del self.auctions[auction_id]
            elif auction.status == AuctionStatus.WAITING and now > auction.exp:
                del self.auctions[auction_id]
                asyncio.create_task(auction.set_status(AuctionStatus.COMPLETED))

    def create_auction(
        self,
        preset_snapshot: PresetDetailDTO,
        is_public: bool,
    ) -> Auction:
        self._purge()
        auction_id = uuid.uuid4().int
        auction = Auction(
            auction_id=auction_id,
            preset_snapshot=preset_snapshot,
            is_public=is_public,
        )
        self.auctions[auction_id] = auction
        return auction

    def get_auction(self, auction_id: int) -> Auction | None:
        return self.auctions.get(auction_id)


auction_manager = AuctionManager()
