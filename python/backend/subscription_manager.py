import asyncio
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.subscription import Plan
from shared.entities import Payment, Subscription
from shared.repositories.subscription_repository import SubscriptionRepository
from shared.utils.db import get_session
from shared.utils.error import AppError, UnexpectedErrorCode, handle_app_error

from .utils.toss import charge_billing_key


_PLAN_AMOUNT = {Plan.PLUS: 10000, Plan.PRO: 20000}
_PLAN_ORDER_NAME = {Plan.PLUS: "Trader Bot Plus", Plan.PRO: "Trader Bot Pro"}
_PLAN_PERIOD = {Plan.PLUS: timedelta(days=30), Plan.PRO: timedelta(days=30)}


class SubscriptionManager:
    _task: asyncio.Task | None = None

    @classmethod
    async def setup(cls) -> None:
        cls._task = asyncio.create_task(cls._main())

    @classmethod
    async def cleanup(cls) -> None:
        if cls._task:
            cls._task.cancel()
            await cls._task

    @classmethod
    async def _main(cls) -> None:
        while True:
            try:
                today = datetime.now(UTC).replace(
                    hour=0, minute=0, second=0, microsecond=0
                ) + timedelta(days=1)
                await asyncio.sleep((today - datetime.now(UTC)).total_seconds())
                if datetime.now(UTC) < today:
                    continue

                async for session in get_session():
                    sub_repo = SubscriptionRepository(session)
                    subscriptions = await sub_repo.get_expireds(today)

                    for sub in subscriptions:
                        await cls._process(sub, today, session)
            except asyncio.CancelledError:
                return
            except Exception as e:
                app_error = AppError(UnexpectedErrorCode.Internal)
                app_error.__cause__ = e
                handle_app_error(app_error)
            await asyncio.sleep(1)

    @classmethod
    async def _process(
        cls, sub: Subscription, today: datetime, session: AsyncSession
    ) -> None:
        billing = sub.billing
        if billing is None:
            return

        plan = Plan(sub.next_plan) if sub.next_plan is not None else Plan(sub.plan)
        amount = _PLAN_AMOUNT[plan]
        order_id = uuid.uuid4().hex
        payment_key: str | None = None
        try:
            payment_key = await charge_billing_key(
                billing.billing_key,
                billing.user.customer_key,
                order_id,
                amount,
                _PLAN_ORDER_NAME[plan],
            )
            async with session.begin_nested():
                await session.execute(
                    update(Subscription)
                    .where(Subscription.subscription_id == sub.subscription_id)
                    .values(
                        plan=int(plan),
                        next_plan=None,
                        expires_at=today + _PLAN_PERIOD[plan],
                    )
                )
                session.add(
                    Payment(
                        guild_id=sub.guild_id,
                        user_id=billing.user_id,
                        billing_id=billing.billing_id,
                        order_id=order_id,
                        payment_key=payment_key,
                        plan=int(plan),
                        amount=amount,
                    )
                )
        except Exception as e:
            session.add(
                Payment(
                    guild_id=sub.guild_id,
                    user_id=billing.user_id,
                    billing_id=billing.billing_id,
                    order_id=order_id,
                    payment_key=payment_key,
                    plan=int(plan),
                    amount=amount,
                )
            )
            app_error = AppError(UnexpectedErrorCode.Internal)
            app_error.__cause__ = e
            handle_app_error(app_error)
