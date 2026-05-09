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
    await verify_role(guild_id, user_id, session, Role.OWNER)

    sub_repo = SubscriptionRepository(session)
    sub = await sub_repo.get_by_guild_id(guild_id)

    billing_repo = BillingRepository(session)
    billing = await billing_repo.get_by_id(dto.billing_id, user_id)
    if billing is None:
        raise HTTPError(BillingErrorCode.NotFound)

    today = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    has_valid = sub is not None and sub.is_valid

    if has_valid:
        plan = Plan(sub.plan)
        next_plan = Plan(sub.next_plan) if sub.next_plan is not None else plan

        if dto.plan == next_plan and sub.billing_id == dto.billing_id:
            raise HTTPError(SubscriptionErrorCode.Duplicated)

        if dto.plan <= plan:
            await session.execute(
                update(Subscription)
                .where(Subscription.subscription_id == sub.subscription_id)
                .values(
                    billing_id=dto.billing_id,
                    next_plan=None if dto.plan == plan else int(dto.plan),
                )
            )
            await session.refresh(sub)
            return SubscriptionDTO.model_validate(sub)

    if has_valid:
        ratio = (sub.expires_at - today).days / _PLAN_PERIOD[plan].days
        amount = round((_PLAN_AMOUNT[dto.plan] - _PLAN_AMOUNT[plan]) * ratio)
    else:
        amount = _PLAN_AMOUNT[dto.plan]

    order_id = uuid.uuid4().hex
    payment_key = await charge_billing_key(
        billing.billing_key,
        f"u-{user_id}",
        order_id,
        amount,
        _PLAN_ORDER_NAME[dto.plan],
    )
    session.add(
        Payment(
            guild_id=guild_id,
            user_id=user_id,
            billing_id=dto.billing_id,
            order_id=order_id,
            payment_key=payment_key,
            plan=int(dto.plan),
            amount=amount,
        )
    )

    if has_valid:
        await session.execute(
            update(Subscription)
            .where(Subscription.subscription_id == sub.subscription_id)
            .values(billing_id=dto.billing_id, plan=int(dto.plan), next_plan=None)
        )
    else:
        expires_at = today + _PLAN_PERIOD[dto.plan]
        if sub is None:
            sub = Subscription(
                guild_id=guild_id,
                billing_id=dto.billing_id,
                plan=int(dto.plan),
                next_plan=None,
                expires_at=expires_at,
            )
            session.add(sub)
            await session.flush()
        else:
            await session.execute(
                update(Subscription)
                .where(Subscription.subscription_id == sub.subscription_id)
                .values(
                    billing_id=dto.billing_id,
                    plan=int(dto.plan),
                    next_plan=None,
                    expires_at=expires_at,
                )
            )

    await session.refresh(sub)
    return SubscriptionDTO.model_validate(sub)


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
    await verify_role(guild_id, user_id, session, Role.OWNER)

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
