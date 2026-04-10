from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction_dto import Team
from shared.entities.auction import Auction as AuctionEntity
from shared.entities.auction import AuctionStatus

from .auction import Auction


class AuctionManager:
    def __init__(self):
        self.auctions: dict[int, Auction] = {}

    def add_auction(
        self,
        auction_id: int,
        preset_id: int,
        guild_id: int,
        teams: list[Team],
        member_ids: list[int],
        leader_member_ids: set[int],
        preset_snapshot: dict,
        timer_duration: int = 5,
        save_snapshot_callback=None,
    ) -> Auction:
        auction = Auction(
            auction_id=auction_id,
            preset_id=preset_id,
            guild_id=guild_id,
            teams=teams,
            member_ids=member_ids,
            leader_member_ids=leader_member_ids,
            preset_snapshot=preset_snapshot,
            timer_duration=timer_duration,
            save_snapshot_callback=save_snapshot_callback,
        )
        self.auctions[auction_id] = auction
        return auction

    def get_auction(self, auction_id: int) -> Auction | None:
        return self.auctions.get(auction_id)

    def remove_auction(self, auction_id: int):
        if auction_id in self.auctions:
            del self.auctions[auction_id]

    async def restore_from_db(self, db: AsyncSession, save_snapshot_callback=None):
        result = await db.execute(
            select(AuctionEntity).where(AuctionEntity.status != AuctionStatus.COMPLETED)
        )
        db_auctions = result.scalars().all()

        for db_auction in db_auctions:
            if db_auction.state_snapshot is None:
                continue
            if db_auction.auction_id in self.auctions:
                continue
            try:
                auction = Auction.from_snapshot(
                    auction_id=db_auction.auction_id,
                    preset_id=db_auction.preset_id,
                    guild_id=db_auction.guild_id,
                    state_snapshot=db_auction.state_snapshot,
                    preset_snapshot=db_auction.preset_snapshot or {},
                    save_snapshot_callback=save_snapshot_callback,
                )
                self.auctions[db_auction.auction_id] = auction
            except Exception:
                pass


auction_manager = AuctionManager()
