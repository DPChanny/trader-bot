from typing import Any

from shared.dtos.auction import (
    AUCTION_LIFETIME,
    AuctionDetailDTO,
    AuctionEventEnvelopeDTO,
    AuctionEventType,
    AuctionResponseEnvelopeDTO,
    AuctionResponseType,
    BidDTO,
    BidErrorResponsePayloadDTO,
    Status,
    TeamDTO,
)
from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_redis


class AuctionWorkerRepository:
    def __init__(self, auction_id: int) -> None:
        self.auction_id = auction_id

    def _key(self, suffix: str = "") -> str:
        if suffix:
            return f"auction:{self.auction_id}:{suffix}"
        return f"auction:{self.auction_id}"

    # ── read ──────────────────────────────────────────────────────────────────

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

    async def get_ttl(self) -> int:
        ttl = await get_redis().ttl(self._key())
        return max(ttl, 0)

    # ── write: init ───────────────────────────────────────────────────────────

    async def save(
        self,
        preset_snapshot: PresetDetailDTO,
        initial_teams: list[TeamDTO],
        initial_queue: list[int],
    ) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(
                self._key(),
                mapping={
                    "status": int(Status.WAITING),
                    "connected_leader_count": 0,
                    "player_id": "",
                    "bid_amount": "",
                    "bid_leader_id": "",
                    "preset_snapshot": preset_snapshot.model_dump_json(),
                },
            )
            pipe.expire(self._key(), AUCTION_LIFETIME)
            for team in initial_teams:
                pipe.hset(
                    self._key("teams"), str(team.leader_id), team.model_dump_json()
                )
            pipe.expire(self._key("teams"), AUCTION_LIFETIME)
            if initial_queue:
                pipe.rpush(self._key("auction_queue"), *initial_queue)
                pipe.expire(self._key("auction_queue"), AUCTION_LIFETIME)
            await pipe.execute()

    async def set_status(self, status: Status) -> None:
        await get_redis().hset(self._key(), "status", int(status))

    async def increment_connected_leader_count(self, amount: int = 1) -> int:
        return int(
            await get_redis().hincrby(self._key(), "connected_leader_count", amount)
        )

    async def acquire_lock(self, timeout: int = 5) -> bool:
        result = await get_redis().set(self._key("lock"), "1", nx=True, ex=timeout)
        return result is not None

    async def release_lock(self) -> None:
        await get_redis().delete(self._key("lock"))

    async def update_team(self, team: TeamDTO) -> None:
        await get_redis().hset(
            self._key("teams"), str(team.leader_id), team.model_dump_json()
        )

    async def push_unsold(self, player_id: int) -> None:
        await get_redis().rpush(self._key("unsold_queue"), player_id)

    # ── publish: events (Worker -> Backend, broadcast) ───────────────────────

    async def publish_event(
        self, event_type: AuctionEventType, payload: Any | None = None
    ) -> None:
        await get_redis().publish(
            self._key("event"),
            AuctionEventEnvelopeDTO(type=event_type, payload=payload).model_dump_json(),
        )

    # ── publish: response (Worker -> Backend, targeted) ──────────────────────

    async def publish_bid_error(self, leader_id: int, code: int) -> None:
        await get_redis().publish(
            self._key("response"),
            AuctionResponseEnvelopeDTO(
                type=AuctionResponseType.BID_ERROR,
                payload=BidErrorResponsePayloadDTO(leader_id=leader_id, code=code),
            ).model_dump_json(),
        )

    # ── publish: create response (Backend BLPOP release) ─────────────────────

    async def publish_create_response(self) -> None:
        await get_redis().lpush(f"auction:response:{self.auction_id}", "1")

    # ── request channel (Backend -> Worker) ──────────────────────────────────

    async def subscribe_request(self, pubsub: Any) -> None:
        await pubsub.subscribe(self._key("request"))

    async def unsubscribe_request(self, pubsub: Any) -> None:
        await pubsub.unsubscribe(self._key("request"))

    # ── recovery scan ────────────────────────────────────────────────────────

    @classmethod
    async def scan_active_auctions(cls) -> list[tuple[int, AuctionDetailDTO]]:
        r = get_redis()
        result: list[tuple[int, AuctionDetailDTO]] = []
        cursor = 0
        while True:
            cursor, keys = await r.scan(cursor, match="auction:*", count=100)
            for key in keys:
                parts = key.split(":")
                if len(parts) != 2:
                    continue
                try:
                    auction_id = int(parts[1])
                except ValueError:
                    continue
                repo = cls(auction_id)
                detail = await repo.get_detail()
                if detail and detail.status not in (Status.COMPLETED,):
                    result.append((auction_id, detail))
            if cursor == 0:
                break
        return result
