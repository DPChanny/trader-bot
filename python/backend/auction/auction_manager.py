from shared.dtos.auction_dto import Team

from .auction import Auction


class AuctionManager:
    def __init__(self):
        self.auctions: dict[int, Auction] = {}
        self._next_id: int = 1

    def add_auction(
        self,
        preset_id: int,
        guild_id: int,
        teams: list[Team],
        member_ids: list[int],
        leader_member_ids: set[int],
        preset_snapshot: dict,
        timer_duration: int = 5,
    ) -> Auction:
        auction_id = self._next_id
        self._next_id += 1
        auction = Auction(
            auction_id=auction_id,
            preset_id=preset_id,
            guild_id=guild_id,
            teams=teams,
            member_ids=member_ids,
            leader_member_ids=leader_member_ids,
            preset_snapshot=preset_snapshot,
            timer_duration=timer_duration,
        )
        self.auctions[auction_id] = auction
        return auction

    def get_auction(self, auction_id: int) -> Auction | None:
        return self.auctions.get(auction_id)

    def remove_auction(self, auction_id: int):
        if auction_id in self.auctions:
            del self.auctions[auction_id]


auction_manager = AuctionManager()
