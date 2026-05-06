import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.dtos.subscription import RegisterSubscriptionDTO, SubscriptionDTO, Tier
from shared.entities import Payment, Subscription
from shared.repositories.billing_repository import BillingRepository
from shared.repositories.subscription_repository import SubscriptionRepository
from shared.utils.error import BillingErrorCode, HTTPError, SubscriptionErrorCode
from shared.utils.service import http_service

from ..utils.member import verify_role
from ..utils.toss import charge_billing_key


_TIER_AMOUNT = {Tier.PLUS: 10000, Tier.PRO: 20000}
_TIER_ORDER_NAME = {Tier.PLUS: "Trader Bot Plus", Tier.PRO: "Trader Bot Pro"}
_TIER_PERIOD = {Tier.PLUS: timedelta(days=30), Tier.PRO: timedelta(days=30)}


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
        current_tier = Tier(existing.tier)
        if dto.tier == current_tier and existing.billing_id == dto.billing_id:
            raise HTTPError(SubscriptionErrorCode.Duplicated)

        order_id = uuid.uuid4().hex
        payment_key = None

        if dto.tier > current_tier:
            remaining = existing.expires_at - now
            period = _TIER_PERIOD[current_tier]
            ratio = remaining.total_seconds() / period.total_seconds()
            amount = round(
                (_TIER_AMOUNT[dto.tier] - _TIER_AMOUNT[current_tier]) * ratio
            )
            payment_key = await charge_billing_key(
                billing.billing_key,
                str(user_id),
                order_id,
                amount,
                _TIER_ORDER_NAME[dto.tier],
            )

        await session.execute(
            update(Subscription)
            .where(Subscription.subscription_id == existing.subscription_id)
            .values(billing_id=dto.billing_id, tier=int(dto.tier))
        )
        existing.billing_id = dto.billing_id
        existing.tier = int(dto.tier)
        subscription = existing

        if payment_key is not None:
            session.add(
                Payment(
                    guild_id=guild_id,
                    user_id=user_id,
                    order_id=order_id,
                    payment_key=payment_key,
                    tier=int(dto.tier),
                )
            )
    else:
        order_id = uuid.uuid4().hex
        amount = _TIER_AMOUNT[dto.tier]
        payment_key = await charge_billing_key(
            billing.billing_key,
            str(user_id),
            order_id,
            amount,
            _TIER_ORDER_NAME[dto.tier],
        )

        expires_at = now + _TIER_PERIOD[dto.tier]
        subscription = await sub_repo.upsert(
            guild_id=guild_id,
            billing_id=dto.billing_id,
            tier=int(dto.tier),
            expires_at=expires_at,
        )

        session.add(
            Payment(
                guild_id=guild_id,
                user_id=user_id,
                order_id=order_id,
                payment_key=payment_key,
                tier=int(dto.tier),
            )
        )

    return SubscriptionDTO.model_validate(subscription)


@http_service
async def get_subscription_service(
    guild_id: int, session: AsyncSession
) -> SubscriptionDTO:
    sub_repo = SubscriptionRepository(session)
    subscription = await sub_repo.get_by_guild_id(guild_id)
    if subscription is None:
        raise HTTPError(SubscriptionErrorCode.NotFound)
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
