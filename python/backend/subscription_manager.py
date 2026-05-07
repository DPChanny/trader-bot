import asyncio
import uuid
from datetime import timedelta

from loguru import logger

from shared.dtos.subscription import Plan
from shared.entities import Payment
from shared.repositories.subscription_repository import SubscriptionRepository
from shared.utils.db import get_session
from shared.utils.error import HTTPError

from .utils.toss import charge_billing_key


_PLAN_AMOUNT = {Plan.PLUS: 10000, Plan.PRO: 20000}
_PLAN_ORDER_NAME = {Plan.PLUS: "Trader Bot Plus", Plan.PRO: "Trader Bot Pro"}
_PLAN_PERIOD = {Plan.PLUS: timedelta(days=30), Plan.PRO: timedelta(days=30)}

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

                    plan = Plan(sub.plan)
                    amount = _PLAN_AMOUNT[plan]
                    order_name = _PLAN_ORDER_NAME[plan]
                    order_id = uuid.uuid4().hex
                    customer_key = f"u-{billing.user_id}"

                    try:
                        payment_key, amount = await charge_billing_key(
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
                        continue

                    new_expires_at = sub.expires_at + _PLAN_PERIOD[plan]
                    await sub_repo.upsert(
                        sub.guild_id, sub.billing_id, int(plan), new_expires_at
                    )
                    session.add(
                        Payment(
                            guild_id=sub.guild_id,
                            user_id=billing.user_id,
                            order_id=order_id,
                            payment_key=payment_key,
                            plan=int(plan),
                            amount=amount,
                        )
                    )
        except Exception:
            logger.exception("Unexpected error during subscription renewal")
