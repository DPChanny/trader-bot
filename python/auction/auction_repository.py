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
    NextPlayerEventPayloadDTO,
    Status,
    TeamDTO,
)
from shared.dtos.preset import PresetDetailDTO
from shared.repositories.auction_repository import BaseAuctionRepository
from shared.utils.error import AuctionErrorCode
from shared.utils.redis import get_redis

from .auction_scripts import NEXT_PLAYER_SCRIPT, PLACE_BID_SCRIPT


class AuctionRepository(BaseAuctionRepository):
    async def set(self, preset_snapshot: PresetDetailDTO) -> None:
        leader_ids = [
            pm.member_id for pm in preset_snapshot.preset_members if pm.is_leader
        ]
        initial_teams = [
            TeamDTO(
                team_id=i,
                leader_id=leader_id,
                member_ids=[leader_id],
                points=preset_snapshot.points,
            )
            for i, leader_id in enumerate(leader_ids)
        ]
        initial_queue = [
            pm.member_id for pm in preset_snapshot.preset_members if not pm.is_leader
        ]
        random.shuffle(initial_queue)

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

    async def get_ttl(self) -> int:
        ttl = await get_redis().ttl(self._key())
        return max(ttl, 0)

    async def set_status(self, status: Status) -> None:
        await get_redis().hset(self._key(), "status", int(status))

    async def increment_connected_leader_count(self, amount: int = 1) -> int:
        return int(
            await get_redis().hincrby(self._key(), "connected_leader_count", amount)
        )

    async def update_team(self, team: TeamDTO) -> None:
        await get_redis().hset(
            self._key("teams"), str(team.leader_id), team.model_dump_json()
        )

    async def push_unsold(self, player_id: int) -> None:
        await get_redis().rpush(self._key("unsold_queue"), player_id)

    async def publish_event(
        self, event_type: AuctionEventType, payload: Any | None = None
    ) -> None:
        await get_redis().publish(
            self._key("event"),
            AuctionEventEnvelopeDTO(type=event_type, payload=payload).model_dump_json(),
        )

    async def publish_bid_error(self, leader_id: int, code: int) -> None:
        await get_redis().publish(
            self._key("response"),
            AuctionResponseEnvelopeDTO(
                type=AuctionResponseType.BID_ERROR,
                payload=BidErrorResponsePayloadDTO(leader_id=leader_id, code=code),
            ).model_dump_json(),
        )

    async def publish_create_response(self) -> None:
        await get_redis().lpush(f"auction:response:{self.auction_id}", "1")

    async def subscribe(self, pubsub: Any) -> None:
        await pubsub.subscribe(self._key("request"))

    async def unsubscribe(self, pubsub: Any) -> None:
        await pubsub.unsubscribe(self._key("request"))

    async def next_player(
        self, auction_queue: list[int], unsold_queue: list[int], teams: list[TeamDTO]
    ) -> tuple[int, list[int], list[int]] | None:
        if auction_queue:
            next_player_id = auction_queue[0]
            next_auction_queue = auction_queue[1:]
            next_unsold_queue = unsold_queue
        elif unsold_queue:
            next_player_id = unsold_queue[0]
            next_auction_queue = unsold_queue[1:]
            next_unsold_queue = []
        else:
            return None

        envelope = AuctionEventEnvelopeDTO(
            type=AuctionEventType.NEXT_PLAYER,
            payload=NextPlayerEventPayloadDTO(
                player_id=next_player_id,
                teams=teams,
                auction_queue=next_auction_queue,
                unsold_queue=next_unsold_queue,
            ),
        ).model_dump_json()

        result = await get_redis().eval(
            NEXT_PLAYER_SCRIPT,
            4,
            self._key("auction_queue"),
            self._key("unsold_queue"),
            self._key(),
            self._key("event"),
            envelope,
        )
        if not result:
            return None

        return next_player_id, next_auction_queue, next_unsold_queue

    async def place_bid(self, bid: BidDTO, player_id: int, team_size: int) -> bool:
        bid_placed_event = AuctionEventEnvelopeDTO(
            type=AuctionEventType.BID_PLACED,
            payload=BidPlacedEventPayloadDTO(
                leader_id=bid.leader_id, amount=bid.amount, player_id=player_id
            ),
        ).model_dump_json()

        result = await get_redis().eval(
            PLACE_BID_SCRIPT,
            3,
            self._key(),
            self._key("teams"),
            self._key("event"),
            str(bid.leader_id),
            str(bid.amount),
            str(team_size),
            bid_placed_event,
            str(AuctionErrorCode.BidInvalidState),
            str(AuctionErrorCode.BidTeamFull),
            str(AuctionErrorCode.BidInvalidAmount),
        )
        if result != 0:
            await self.publish_bid_error(bid.leader_id, int(result))
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
