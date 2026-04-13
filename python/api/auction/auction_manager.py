import uuid

from shared.dtos.preset_dto import PresetDetailDTO

from .auction import Auction


class AuctionManager:
    def __init__(self):
        self.auctions: dict[int, Auction] = {}

    def create_auction(
        self,
        preset_snapshot: PresetDetailDTO,
        allow_public: bool = True,
    ) -> Auction:
        auction_id = uuid.uuid4().int
        auction = Auction(
            auction_id=auction_id,
            preset_snapshot=preset_snapshot,
            allow_public=allow_public,
        )
        self.auctions[auction_id] = auction
        return auction

    def get_auction(self, auction_id: int) -> Auction | None:
        return self.auctions.get(auction_id)

    def remove_auction(self, auction_id: int):
        if auction_id in self.auctions:
            del self.auctions[auction_id]


auction_manager = AuctionManager()
