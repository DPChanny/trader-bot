import time
from typing import Any

from shared.dtos.auction import (
    AuctionDetailDTO,
    AuctionEventEnvelopeDTO,
    AuctionEventType,
    BidDTO,
    Status,
    StatusPayloadDTO,
    TeamDTO,
)
from shared.dtos.preset import PresetDetailDTO
from shared.utils.error import AuctionErrorCode
from shared.utils.redis import get_redis

from .auction import Auction, Bid, Team


_AUCTION_LIFETIME = 3600

_NEXT_PLAYER_SCRIPT = """
    local next_player_id = redis.call('LINDEX', KEYS[1], 0)
    if next_player_id then
        redis.call('HSET', KEYS[3], 'player_id', next_player_id, 'bid_amount', '', 'bid_leader_id', '')
        redis.call('LPOP', KEYS[1])
        redis.call('PUBLISH', KEYS[4], ARGV[1])
        return 1
    end
    local unsold_queue = redis.call('LRANGE', KEYS[2], 0, -1)
    if #unsold_queue == 0 then
        return 0
    end
    redis.call('DEL', KEYS[2])
    for _, id in ipairs(unsold_queue) do
        redis.call('RPUSH', KEYS[1], id)
    end
    local next_player_id = redis.call('LPOP', KEYS[1])
    redis.call('HSET', KEYS[3], 'player_id', next_player_id, 'bid_amount', '', 'bid_leader_id', '')
    redis.call('PUBLISH', KEYS[4], ARGV[1])
    return 1
"""

# KEYS[1]=auction_key, KEYS[2]=teams_key (keyed by leader_id), KEYS[3]=event_channel
# ARGV[1]=leader_id, ARGV[2]=amount, ARGV[3]=team_size, ARGV[4]=event_json
# ARGV[5]=ERR_INVALID_STATE, ARGV[6]=ERR_TEAM_FULL, ARGV[7]=ERR_INVALID_AMOUNT
# Returns 0 on success, error_code on failure
_PLACE_BID_SCRIPT = """
    local state = redis.call('HMGET', KEYS[1], 'status', 'player_id', 'bid_amount')
    local status = state[1]
    local player_id = state[2]
    local bid_amount_str = state[3]

    if status ~= '2' or not player_id or player_id == '' then
        return tonumber(ARGV[5])
    end

    local amount = tonumber(ARGV[2])
    local team_size = tonumber(ARGV[3])

    local team_json_str = redis.call('HGET', KEYS[2], ARGV[1])
    if not team_json_str then
        return tonumber(ARGV[5])
    end

    local team = cjson.decode(team_json_str)
    local member_count = #team['member_ids']

    if member_count >= team_size then
        return tonumber(ARGV[6])
    end

    local remaining_slots = team_size - member_count
    local max_bid = team['points'] - (remaining_slots - 1)
    if amount > max_bid then
        return tonumber(ARGV[7])
    end

    local current_bid = 0
    if bid_amount_str and bid_amount_str ~= '' then
        current_bid = tonumber(bid_amount_str)
    end
    if amount < current_bid + 1 then
        return tonumber(ARGV[7])
    end

    redis.call('HSET', KEYS[1], 'bid_amount', ARGV[2], 'bid_leader_id', ARGV[1])
    redis.call('PUBLISH', KEYS[3], ARGV[4])
    return 0
"""


class AuctionRepository:
    def __init__(self, auction_id: int) -> None:
        self.auction_id = auction_id

    def _key(self, suffix: str = "") -> str:
        if suffix:
            return f"auction:{self.auction_id}:{suffix}"
        return f"auction:{self.auction_id}"

    async def get_state(self) -> dict | None:
        data = await get_redis().hgetall(self._key())
        return data if data else None

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

    async def get_player_state(self) -> tuple[Status, int | None, Bid | None]:
        values = await get_redis().hmget(
            self._key(), "status", "player_id", "bid_amount", "bid_leader_id"
        )
        status_raw, player_id_raw, bid_amount_raw, bid_leader_id_raw = values
        status = Status(int(status_raw)) if status_raw else Status.WAITING
        player_id = int(player_id_raw) if player_id_raw else None
        bid = (
            Bid(amount=int(bid_amount_raw), leader_id=int(bid_leader_id_raw))
            if bid_amount_raw
            else None
        )
        return status, player_id, bid

    async def get_team_by_leader(self, leader_id: int) -> Team | None:
        team_json = await get_redis().hget(self._key("teams"), str(leader_id))
        return Team.model_validate_json(team_json) if team_json else None

    async def validate_and_place_bid(self, bid: Bid, team_size: int) -> int:
        event_json = AuctionEventEnvelopeDTO(
            type=AuctionEventType.BID_PLACED,
            payload=BidDTO(leader_id=bid.leader_id, amount=bid.amount),
        ).model_dump_json()
        result = await get_redis().eval(
            _PLACE_BID_SCRIPT,
            3,
            self._key(),
            self._key("teams"),
            self._key("event"),
            str(bid.leader_id),
            str(bid.amount),
            str(team_size),
            event_json,
            str(AuctionErrorCode.BidInvalidState),
            str(AuctionErrorCode.BidTeamFull),
            str(AuctionErrorCode.BidInvalidAmount),
        )
        return int(result)

    async def subscribe(self, pubsub: Any) -> None:
        await pubsub.subscribe(self._key("event"))

    async def unsubscribe(self, pubsub: Any) -> None:
        await pubsub.unsubscribe(self._key("event"))

    async def get_ttl(self) -> int:
        ttl = await get_redis().ttl(self._key())
        return max(ttl, 0)

    async def save(
        self, session: Auction, initial_teams: list[Team], initial_queue: list[int]
    ) -> None:
        r = get_redis()
        state_mapping = {
            "status": str(Status.WAITING.value),
            "player_id": "",
            "bid_amount": "",
            "bid_leader_id": "",
            "preset_snapshot": session.preset_snapshot.model_dump_json(),
            "connected_leader_count": "0",
        }
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(self._key(), mapping=state_mapping)
            pipe.expire(self._key(), _AUCTION_LIFETIME)
            for team in initial_teams:
                pipe.hset(
                    self._key("teams"), str(team.leader_id), team.model_dump_json()
                )
            pipe.expire(self._key("teams"), _AUCTION_LIFETIME)
            if initial_queue:
                pipe.rpush(self._key("auction_queue"), *initial_queue)
                pipe.expire(self._key("auction_queue"), _AUCTION_LIFETIME)
            await pipe.execute()

    async def publish_leader_connected(self) -> int:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hincrby(self._key(), "connected_leader_count", 1)
            pipe.publish(
                self._key("event"),
                AuctionEventEnvelopeDTO(
                    type=AuctionEventType.LEADER_CONNECTED, payload=None
                ).model_dump_json(),
            )
            results = await pipe.execute()
        return int(results[0])

    async def publish_leader_disconnected(self) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hincrby(self._key(), "connected_leader_count", -1)
            pipe.publish(
                self._key("event"),
                AuctionEventEnvelopeDTO(
                    type=AuctionEventType.LEADER_DISCONNECTED, payload=None
                ).model_dump_json(),
            )
            await pipe.execute()

    async def publish_next_player(self) -> bool:
        result = await get_redis().eval(
            _NEXT_PLAYER_SCRIPT,
            4,
            self._key("auction_queue"),
            self._key("unsold_queue"),
            self._key(),
            self._key("event"),
            AuctionEventEnvelopeDTO(
                type=AuctionEventType.NEXT_PLAYER, payload=None
            ).model_dump_json(),
        )
        return bool(result)

    async def set_timer_started_at(self) -> None:
        await get_redis().hset(self._key(), "timer_started_at", str(int(time.time())))

    async def get_timer_started_at(self) -> int | None:
        value = await get_redis().hget(self._key(), "timer_started_at")
        return int(value) if value else None

    async def acquire_state_lock(self) -> bool:
        return bool(await get_redis().set(self._key("state_lock"), "1", nx=True, ex=30))

    async def release_state_lock(self) -> None:
        await get_redis().delete(self._key("state_lock"))

    async def acquire_timer_lock(self) -> bool:
        return bool(await get_redis().set(self._key("timer_lock"), "1", nx=True, ex=30))

    async def release_timer_lock(self) -> None:
        await get_redis().delete(self._key("timer_lock"))

    async def publish_status(self, status: Status) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(self._key(), mapping={"status": str(status.value)})
            pipe.publish(
                self._key("event"),
                AuctionEventEnvelopeDTO(
                    type=AuctionEventType.STATUS,
                    payload=StatusPayloadDTO(status=status),
                ).model_dump_json(),
            )
            await pipe.execute()

    async def publish_member_sold(self, team: Team) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(
                self._key(),
                mapping={"player_id": "", "bid_amount": "", "bid_leader_id": ""},
            )
            pipe.hset(self._key("teams"), str(team.leader_id), team.model_dump_json())
            pipe.publish(
                self._key("event"),
                AuctionEventEnvelopeDTO(
                    type=AuctionEventType.MEMBER_SOLD, payload=None
                ).model_dump_json(),
            )
            await pipe.execute()

    async def publish_member_unsold(self, player_id: int) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(
                self._key(),
                mapping={"player_id": "", "bid_amount": "", "bid_leader_id": ""},
            )
            pipe.rpush(self._key("unsold_queue"), player_id)
            pipe.expire(self._key("unsold_queue"), _AUCTION_LIFETIME)
            pipe.publish(
                self._key("event"),
                AuctionEventEnvelopeDTO(
                    type=AuctionEventType.MEMBER_UNSOLD, payload=None
                ).model_dump_json(),
            )
            await pipe.execute()
