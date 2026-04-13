import uuid

from .auction import Auction


class AuctionManager:
    def __init__(self):
        self.auctions: dict[int, Auction] = {}

    def create_auction(
        self,
        teams,
        member_ids: list[int],
        leader_member_ids: set[int],
        preset_snapshot: dict,
        timer: int,
        team_size: int,
        allow_public: bool = True,
    ) -> Auction:
        auction_id = uuid.uuid4().int
        auction = Auction(
            auction_id=auction_id,
            teams=teams,
            member_ids=member_ids,
            leader_member_ids=leader_member_ids,
            preset_snapshot=preset_snapshot,
            timer=timer,
            team_size=team_size,
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
