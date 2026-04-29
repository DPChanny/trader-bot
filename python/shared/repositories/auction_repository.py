from shared.dtos.auction import AuctionDetailDTO, BidDTO, Status, TeamDTO
from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_redis


class BaseAuctionRepository:
    def __init__(self, auction_id: int) -> None:
        self.auction_id = auction_id

    def _key(self, suffix: str = "") -> str:
        if suffix:
            return f"auction:{self.auction_id}:{suffix}"
        return f"auction:{self.auction_id}"

    async def get_detail(self) -> AuctionDetailDTO | None:
        r = get_redis()
        async with r.pipeline(transaction=False) as pipe:
            pipe.hgetall(self._key())
            pipe.hgetall(self._key("teams"))
            pipe.lrange(self._key("auction_queue"), 0, -1)
            pipe.lrange(self._key("unsold_queue"), 0, -1)
            pipe.hgetall(self._key("bid"))
            pipe.ttl(self._key())
            data, teams_raw, aq_raw, uq_raw, bid_raw, ttl = await pipe.execute()
        if not data:
            return None
        bid = (
            BidDTO(amount=int(bid_raw["amount"]), leader_id=int(bid_raw["leader_id"]))
            if bid_raw.get("amount")
            else None
        )
        preset_snapshot = (
            PresetDetailDTO.model_validate_json(data["preset_snapshot"])
            if data["preset_snapshot"]
            else None
        )
        return AuctionDetailDTO(
            auction_id=self.auction_id,
            status=Status(int(data["status"])),
            connected_leader_count=int(data["connected_leader_count"]),
            player_id=int(data["player_id"]) if data["player_id"] else None,
            bid=bid,
            teams=[TeamDTO.model_validate_json(v) for v in teams_raw.values()],
            auction_queue=[int(x) for x in aq_raw],
            unsold_queue=[int(x) for x in uq_raw],
            preset_snapshot=preset_snapshot,
            ttl=max(ttl, 0),
            timer=int(data["timer"]),
        )
