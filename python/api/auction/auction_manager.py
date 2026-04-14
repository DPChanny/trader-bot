import asyncio
import uuid
from datetime import datetime
from typing import ClassVar

from shared.dtos.preset import PresetDetailDTO

from .auction import Auction


class AuctionManager:
    _auctions: ClassVar[dict[int, Auction]] = {}

    @classmethod
    def _purge(cls) -> None:
        now = datetime.now()
        for auction_id, auction in list(cls._auctions.items()):
            if auction.status == Auction.Status.COMPLETED:
                del cls._auctions[auction_id]
            elif auction.status == Auction.Status.WAITING and now > auction.exp:
                del cls._auctions[auction_id]
                asyncio.create_task(auction.set_status(Auction.Status.COMPLETED))

    @classmethod
    def create_auction(
        cls,
        preset_snapshot: PresetDetailDTO,
        is_public: bool,
    ) -> Auction:
        cls._purge()
        auction_id = uuid.uuid4().int
        auction = Auction(
            auction_id=auction_id,
            preset_snapshot=preset_snapshot,
            is_public=is_public,
        )
        cls._auctions[auction_id] = auction
        return auction

    @classmethod
    def get_auction(cls, auction_id: int) -> Auction | None:
        cls._purge()
        return cls._auctions.get(auction_id)
