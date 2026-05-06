import asyncio
import uuid
from datetime import timedelta

from loguru import logger

from shared.dtos.subscription import Tier
from shared.entities import Payment
from shared.repositories.subscription_repository import SubscriptionRepository
from shared.utils.db import get_session
from shared.utils.error import HTTPError

from .utils.toss import charge_billing_key


_TIER_AMOUNT = {Tier.PLUS: 10000, Tier.PRO: 20000}
_TIER_ORDER_NAME = {Tier.PLUS: "Trader Bot Plus", Tier.PRO: "Trader Bot Pro"}
_TIER_PERIOD = {Tier.PLUS: timedelta(days=30), Tier.PRO: timedelta(days=30)}

_RENEWAL_BUFFER = timedelta(days=1)
_RENEWAL_INTERVAL = timedelta(hours=1)


class SubscriptionManager:
    _task: asyncio.Task | None = None

    @classmethod
    async def setup(cls) -> None:
        cls._task = asyncio.create_task(cls._run())

    @classmethod
    async def cleanup(cls) -> None:
        if cls._task:
            cls._task.cancel()
            await cls._task

    @classmethod
    async def _run(cls) -> None:
        try:
            while True:
                await asyncio.sleep(_RENEWAL_INTERVAL.total_seconds())
                await cls._renew()
        except asyncio.CancelledError:
            pass

    @classmethod
    async def _renew(cls) -> None:
        try:
            async for session in get_session():
                sub_repo = SubscriptionRepository(session)
                subscriptions = await sub_repo.get_renewables(_RENEWAL_BUFFER)

                for sub in subscriptions:
                    billing = sub.billing
                    if billing is None:
                        continue

                    tier = Tier(sub.tier)
                    amount = _TIER_AMOUNT[tier]
                    order_name = _TIER_ORDER_NAME[tier]
                    order_id = uuid.uuid4().hex
                    customer_key = str(billing.user_id)

                    try:
                        payment_key = await charge_billing_key(
                            billing.billing_key,
                            customer_key,
                            order_id,
                            amount,
                            order_name,
                        )
                    except HTTPError:
                        logger.warning(
                            f"Renewal charge failed for subscription {sub.subscription_id}"
                        )
                        await session.delete(billing)
                        continue

                    new_expires_at = sub.expires_at + _TIER_PERIOD[tier]
                    await sub_repo.upsert(
                        sub.guild_id, sub.billing_id, int(tier), new_expires_at
                    )
                    session.add(
                        Payment(
                            guild_id=sub.guild_id,
                            user_id=billing.user_id,
                            order_id=order_id,
                            payment_key=payment_key,
                            tier=int(tier),
                        )
                    )
        except Exception:
            logger.exception("Unexpected error during subscription renewal")
