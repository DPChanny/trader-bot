import asyncio
import random

from loguru import logger
from pydantic import ValidationError

from shared.dtos.auction import AuctionRequestEnvelopeDTO, AuctionRequestType, TeamDTO
from shared.utils.redis import get_pubsub

from .repository import AuctionWorkerRepository
from .worker import AuctionWorker


class AuctionWorkerManager:
    _GLOBAL_REQUEST_CHANNEL = "auction:request"

    def __init__(self) -> None:
        self._pubsub = get_pubsub()
        self._loops: dict[int, asyncio.Task] = {}
        self._listener_task: asyncio.Task | None = None

    async def setup(self) -> None:
        await self._pubsub.subscribe(self._GLOBAL_REQUEST_CHANNEL)
        self._listener_task = asyncio.create_task(self._listener())
        await self._recover()

    async def cleanup(self) -> None:
        if self._listener_task:
            self._listener_task.cancel()
            with asyncio.suppress(asyncio.CancelledError):
                await self._listener_task
        for task in self._loops.values():
            task.cancel()
        if self._loops:
            await asyncio.gather(*self._loops.values(), return_exceptions=True)
        self._loops.clear()
        await self._pubsub.close()

    async def _recover(self) -> None:
        active = await AuctionWorkerRepository.scan_active_auctions()
        for auction_id, detail in active:
            if auction_id in self._loops:
                continue
            if not detail.preset_snapshot:
                logger.warning(
                    f"Recovery: auction {auction_id} has no preset_snapshot, skipping"
                )
                continue
            logger.info(f"Recovering auction {auction_id}")
            loop = AuctionWorker(
                auction_id=auction_id,
                preset_snapshot=detail.preset_snapshot,
                resume=True,
            )
            task = asyncio.create_task(loop.run())
            self._loops[auction_id] = task
            task.add_done_callback(lambda t, aid=auction_id: self._loops.pop(aid, None))

    async def _listener(self) -> None:
        while True:
            try:
                async for message in self._pubsub.listen():
                    if message["type"] != "message":
                        continue
                    try:
                        envelope = AuctionRequestEnvelopeDTO.model_validate_json(
                            message["data"]
                        )
                    except ValidationError, Exception:
                        continue

                    if envelope.type != AuctionRequestType.CREATE:
                        continue

                    from shared.dtos.auction import CreateRequestPayloadDTO

                    try:
                        payload = CreateRequestPayloadDTO.model_validate(
                            envelope.payload
                        )
                    except ValidationError, Exception:
                        logger.error("Invalid CREATE request payload")
                        continue

                    auction_id = payload.auction_id
                    if auction_id in self._loops:
                        logger.warning(f"Auction {auction_id} already running")
                        continue

                    preset = payload.preset_snapshot
                    leader_ids = [
                        pm.member_id for pm in preset.preset_members if pm.is_leader
                    ]
                    initial_teams = [
                        TeamDTO(
                            team_id=i,
                            leader_id=leader_id,
                            member_ids=[leader_id],
                            points=preset.points,
                        )
                        for i, leader_id in enumerate(leader_ids)
                    ]
                    initial_queue = [
                        pm.member_id for pm in preset.preset_members if not pm.is_leader
                    ]
                    random.shuffle(initial_queue)

                    loop = AuctionWorker(
                        auction_id=auction_id, preset_snapshot=preset, resume=False
                    )
                    repo = AuctionWorkerRepository(auction_id)
                    await repo.save(
                        preset_snapshot=preset,
                        initial_teams=initial_teams,
                        initial_queue=initial_queue,
                    )
                    task = asyncio.create_task(loop.run())
                    self._loops[auction_id] = task
                    task.add_done_callback(
                        lambda t, aid=auction_id: self._loops.pop(aid, None)
                    )
            except asyncio.CancelledError:
                return
            except Exception as e:
                logger.error(f"Manager listener error: {type(e).__name__}: {e}")
            await asyncio.sleep(1)
