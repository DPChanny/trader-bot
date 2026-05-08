import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.dtos.subscription import Plan, RegisterSubscriptionDTO, SubscriptionDTO
from shared.entities import Payment, Subscription
from shared.repositories.billing_repository import BillingRepository
from shared.repositories.subscription_repository import SubscriptionRepository
from shared.utils.error import BillingErrorCode, HTTPError, SubscriptionErrorCode
from shared.utils.service import http_service

from ..utils.member import verify_role
from ..utils.toss import charge_billing_key


_PLAN_AMOUNT = {Plan.PLUS: 10000, Plan.PRO: 20000}
_PLAN_ORDER_NAME = {Plan.PLUS: "Trader Bot Plus", Plan.PRO: "Trader Bot Pro"}
_PLAN_PERIOD = {Plan.PLUS: timedelta(days=30), Plan.PRO: timedelta(days=30)}


@http_service
async def register_subscription_service(
    guild_id: int, user_id: int, dto: RegisterSubscriptionDTO, session: AsyncSession
) -> SubscriptionDTO:
    await verify_role(guild_id, user_id, session, Role.ADMIN)

    sub_repo = SubscriptionRepository(session)
    existing = await sub_repo.get_by_guild_id(guild_id)

    billing_repo = BillingRepository(session)
    billing = await billing_repo.get_by_id(dto.billing_id, user_id)
    if billing is None:
        raise HTTPError(BillingErrorCode.NotFound)

    now = datetime.now(UTC)
    is_active = existing is not None and existing.expires_at > now

    if is_active:
        current_plan = Plan(existing.plan)
        if dto.plan == current_plan and existing.billing_id == dto.billing_id:
            raise HTTPError(SubscriptionErrorCode.Duplicated)

        order_id = uuid.uuid4().hex
        payment_key = None

        if dto.plan > current_plan:
            remaining = existing.expires_at - now
            period = _PLAN_PERIOD[current_plan]
            ratio = remaining.total_seconds() / period.total_seconds()
            amount = round(
                (_PLAN_AMOUNT[dto.plan] - _PLAN_AMOUNT[current_plan]) * ratio
            )
            payment_key, amount = await charge_billing_key(
                billing.billing_key,
                str(user_id),
                order_id,
                amount,
                _PLAN_ORDER_NAME[dto.plan],
            )

        await session.execute(
            update(Subscription)
            .where(Subscription.subscription_id == existing.subscription_id)
            .values(billing_id=dto.billing_id, plan=int(dto.plan))
        )
        existing.billing_id = dto.billing_id
        existing.plan = int(dto.plan)
        subscription = existing

        if payment_key is not None:
            session.add(
                Payment(
                    guild_id=guild_id,
                    user_id=user_id,
                    order_id=order_id,
                    payment_key=payment_key,
                    plan=int(dto.plan),
                    amount=amount,
                )
            )
    else:
        order_id = uuid.uuid4().hex
        amount = _PLAN_AMOUNT[dto.plan]
        payment_key, amount = await charge_billing_key(
            billing.billing_key,
            str(user_id),
            order_id,
            amount,
            _PLAN_ORDER_NAME[dto.plan],
        )

        expires_at = now + _PLAN_PERIOD[dto.plan]
        subscription = await sub_repo.upsert(
            guild_id=guild_id,
            billing_id=dto.billing_id,
            plan=int(dto.plan),
            expires_at=expires_at,
        )

        session.add(
            Payment(
                guild_id=guild_id,
                user_id=user_id,
                order_id=order_id,
                payment_key=payment_key,
                plan=int(dto.plan),
                amount=amount,
            )
        )

    return SubscriptionDTO.model_validate(subscription)


@http_service
async def get_subscription_service(
    guild_id: int, session: AsyncSession
) -> SubscriptionDTO | None:
    sub_repo = SubscriptionRepository(session)
    subscription = await sub_repo.get_by_guild_id(guild_id)
    if subscription is None:
        return None
    return SubscriptionDTO.model_validate(subscription)


@http_service
async def cancel_subscription_service(
    guild_id: int, user_id: int, session: AsyncSession
) -> None:
    await verify_role(guild_id, user_id, session, Role.ADMIN)

    sub_repo = SubscriptionRepository(session)
    subscription = await sub_repo.get_by_guild_id(guild_id)
    if subscription is None:
        raise HTTPError(SubscriptionErrorCode.NotFound)
    if subscription.billing_id is None:
        raise HTTPError(BillingErrorCode.NotFound)

    await session.execute(
        update(Subscription)
        .where(Subscription.subscription_id == subscription.subscription_id)
        .values(billing_id=None)
    )
