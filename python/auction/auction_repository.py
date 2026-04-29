import random
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
    BidPlacedEventPayloadDTO,
    Status,
    StatusEventPayloadDTO,
    TeamDTO,
    TickEventPayloadDTO,
)
from shared.dtos.preset import PresetDetailDTO
from shared.repositories.auction_repository import BaseAuctionRepository
from shared.utils.error import AuctionErrorCode
from shared.utils.redis import get_redis

from .scripts import (
    NEXT_PLAYER_SCRIPT,
    PLACE_BID_SCRIPT,
    PUBLISH_LEADER_SCRIPT,
    PUBLISH_MEMBER_SOLD_SCRIPT,
)


class AuctionRepository(BaseAuctionRepository):
    async def set(self, preset_snapshot: PresetDetailDTO) -> None:
        leader_ids = [
            pm.member_id for pm in preset_snapshot.preset_members if pm.is_leader
        ]
        teams = [
            TeamDTO(
                team_id=i,
                leader_id=leader_id,
                member_ids=[leader_id],
                points=preset_snapshot.points,
            )
            for i, leader_id in enumerate(leader_ids)
        ]
        auction_queue = [
            pm.member_id for pm in preset_snapshot.preset_members if not pm.is_leader
        ]
        random.shuffle(auction_queue)

        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(
                self._key(),
                mapping={
                    "status": int(Status.WAITING),
                    "connected_leader_count": 0,
                    "player_id": "",
                    "preset_snapshot": preset_snapshot.model_dump_json(),
                },
            )
            pipe.expire(self._key(), AUCTION_LIFETIME)
            for team in teams:
                pipe.hset(
                    self._key("teams"), str(team.leader_id), team.model_dump_json()
                )
            pipe.expire(self._key("teams"), AUCTION_LIFETIME)
            if auction_queue:
                pipe.rpush(self._key("auction_queue"), *auction_queue)
                pipe.expire(self._key("auction_queue"), AUCTION_LIFETIME)
            pipe.delete(self._key("unsold_queue"))
            pipe.delete(self._key("bid"))
            await pipe.execute()

    async def publish_status(self, status: Status) -> None:
        event = AuctionEventEnvelopeDTO(
            type=AuctionEventType.STATUS, payload=StatusEventPayloadDTO(status=status)
        ).model_dump_json()
        r = get_redis()
        async with r.pipeline(transaction=False) as pipe:
            pipe.hset(self._key(), "status", int(status))
            pipe.publish(self._key("event"), event)
            await pipe.execute()

    async def publish_leader_connected(self, leader_id: int) -> int:
        return int(
            await get_redis().eval(
                PUBLISH_LEADER_SCRIPT,
                2,
                self._key(),
                self._key("event"),
                1,
                int(AuctionEventType.LEADER_CONNECTED),
            )
        )

    async def publish_leader_disconnected(self, leader_id: int) -> int:
        return int(
            await get_redis().eval(
                PUBLISH_LEADER_SCRIPT,
                2,
                self._key(),
                self._key("event"),
                -1,
                int(AuctionEventType.LEADER_DISCONNECTED),
            )
        )

    async def publish_member_sold(
        self, leader_id: int, player_id: int, bid: BidDTO
    ) -> None:
        await get_redis().eval(
            PUBLISH_MEMBER_SOLD_SCRIPT,
            4,
            self._key("teams"),
            self._key("event"),
            self._key(),
            self._key("bid"),
            str(leader_id),
            str(player_id),
            str(bid.amount),
            str(int(AuctionEventType.MEMBER_SOLD)),
        )

    async def publish_member_unsold(self, player_id: int) -> None:
        event = AuctionEventEnvelopeDTO(
            type=AuctionEventType.MEMBER_UNSOLD, payload=None
        ).model_dump_json()
        r = get_redis()
        async with r.pipeline(transaction=False) as pipe:
            pipe.hset(self._key(), "player_id", "")
            pipe.delete(self._key("bid"))
            pipe.rpush(self._key("unsold_queue"), player_id)
            pipe.expireat(self._key("unsold_queue"), await r.expiretime(self._key()))
            pipe.publish(self._key("event"), event)
            await pipe.execute()

    async def publish_tick(self, remaining: int) -> None:
        event = AuctionEventEnvelopeDTO(
            type=AuctionEventType.TICK, payload=TickEventPayloadDTO(timer=remaining)
        ).model_dump_json()
        await get_redis().publish(self._key("event"), event)

    async def publish_bid_error(self, leader_id: int, code: int) -> None:
        await get_redis().publish(
            self._key("response"),
            AuctionResponseEnvelopeDTO(
                type=AuctionResponseType.BID_ERROR,
                payload=BidErrorResponsePayloadDTO(leader_id=leader_id, code=code),
            ).model_dump_json(),
        )

    async def publish_create_response(self) -> None:
        r = get_redis()
        async with r.pipeline(transaction=False) as pipe:
            pipe.lpush(f"auction:response:{self.auction_id}", "1")
            pipe.expire(f"auction:response:{self.auction_id}", 5)
            await pipe.execute()

    async def subscribe(self, pubsub: Any) -> None:
        await pubsub.subscribe(self._key("request"))

    async def unsubscribe(self, pubsub: Any) -> None:
        await pubsub.unsubscribe(self._key("request"))

    async def next_player(self) -> int | None:
        result = await get_redis().eval(
            NEXT_PLAYER_SCRIPT,
            5,
            self._key("auction_queue"),
            self._key("unsold_queue"),
            self._key(),
            self._key("event"),
            self._key("bid"),
            int(AuctionEventType.NEXT_PLAYER),
        )
        return int(result) if result else None

    async def place_bid(self, dto: BidDTO, player_id: int, team_size: int) -> bool:
        event = AuctionEventEnvelopeDTO(
            type=AuctionEventType.BID_PLACED,
            payload=BidPlacedEventPayloadDTO(
                leader_id=dto.leader_id, amount=dto.amount
            ),
        ).model_dump_json()

        result = await get_redis().eval(
            PLACE_BID_SCRIPT,
            4,
            self._key(),
            self._key("teams"),
            self._key("event"),
            self._key("bid"),
            str(dto.leader_id),
            str(dto.amount),
            str(team_size),
            event,
            str(AuctionErrorCode.BidTeamFull),
            str(AuctionErrorCode.BidTooLow),
            str(AuctionErrorCode.BidDuplicate),
            str(AuctionErrorCode.BidTooHigh),
        )
        if result != 0:
            await self.publish_bid_error(dto.leader_id, int(result))
            return False
        return True

    @classmethod
    async def get_all(cls) -> list[tuple[int, AuctionDetailDTO]]:
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
                if detail:
                    result.append((auction_id, detail))
            if cursor == 0:
                break
        return result
