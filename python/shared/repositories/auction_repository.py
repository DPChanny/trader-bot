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
            data, teams_raw, aq_raw, uq_raw = await pipe.execute()
        if not data:
            return None
        teams = [TeamDTO.model_validate_json(v) for v in teams_raw.values()]
        bid = (
            BidDTO(amount=int(data["bid_amount"]), leader_id=int(data["bid_leader_id"]))
            if data.get("bid_amount")
            else None
        )
        preset_snapshot = (
            PresetDetailDTO.model_validate_json(data["preset_snapshot"])
            if data.get("preset_snapshot")
            else None
        )
        return AuctionDetailDTO(
            auction_id=self.auction_id,
            status=Status(int(data["status"])),
            connected_leader_count=int(data.get("connected_leader_count") or 0),
            player_id=int(data["player_id"]) if data.get("player_id") else None,
            bid=bid,
            teams=teams,
            auction_queue=[int(x) for x in aq_raw],
            unsold_queue=[int(x) for x in uq_raw],
            preset_snapshot=preset_snapshot,
        )
