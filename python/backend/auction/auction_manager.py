import uuid

from .auction import Auction


class AuctionManager:
    def __init__(self):
        self.auctions: dict[str, Auction] = {}

    def add_auction(
        self,
        teams,
        member_ids: list[int],
        leader_member_ids: set[int],
        preset_snapshot: dict,
        timer_duration: int = 5,
    ) -> Auction:
        auction_id = str(uuid.uuid4())
        auction = Auction(
            auction_id=auction_id,
            teams=teams,
            member_ids=member_ids,
            leader_member_ids=leader_member_ids,
            preset_snapshot=preset_snapshot,
            timer_duration=timer_duration,
        )
        self.auctions[auction_id] = auction
        return auction

    def get_auction(self, auction_id: str) -> Auction | None:
        return self.auctions.get(auction_id)

    def remove_auction(self, auction_id: str):
        if auction_id in self.auctions:
            del self.auctions[auction_id]


auction_manager = AuctionManager()
