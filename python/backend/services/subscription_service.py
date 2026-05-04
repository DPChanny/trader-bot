import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.subscription import (
    CreateSubscriptionDTO,
    SubscriptionDetailDTO,
    SubscriptionDTO,
    Tier,
    UpdateSubscriptionDTO,
)
from shared.entities import Payment, Subscription
from shared.repositories.billing_repository import BillingRepository
from shared.repositories.subscription_repository import SubscriptionRepository
from shared.utils.error import BillingErrorCode, HTTPError, SubscriptionErrorCode
from shared.utils.service import http_service

from ..utils.toss import charge_billing_key


_TIER_AMOUNT = {Tier.PLUS: 10000, Tier.PRO: 20000}
_TIER_ORDER_NAME = {Tier.PLUS: "Trader Bot Plus", Tier.PRO: "Trader Bot Pro"}
_TIER_PERIOD = {Tier.PLUS: timedelta(days=30), Tier.PRO: timedelta(days=30)}


@http_service
async def create_subscription_service(
    guild_id: int, user_id: int, dto: CreateSubscriptionDTO, session: AsyncSession
) -> SubscriptionDTO:
    sub_repo = SubscriptionRepository(session)
    existing = await sub_repo.get_by_guild_id(guild_id)
    if existing is not None and existing.expires_at > datetime.now(UTC):
        raise HTTPError(SubscriptionErrorCode.Duplicated)

    billing_repo = BillingRepository(session)
    billing = await billing_repo.get_by_id(dto.billing_id)
    if billing is None or billing.user_id != user_id:
        raise HTTPError(BillingErrorCode.NotFound)

    customer_key = str(user_id)
    order_id = uuid.uuid4().hex
    amount = _TIER_AMOUNT[dto.tier]
    order_name = _TIER_ORDER_NAME[dto.tier]

    payment_key = await charge_billing_key(
        billing.billing_key, customer_key, order_id, amount, order_name
    )

    expires_at = datetime.now(UTC) + _TIER_PERIOD[dto.tier]
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
) -> SubscriptionDetailDTO:
    sub_repo = SubscriptionRepository(session)
    subscription = await sub_repo.get_detail_by_guild_id(guild_id)
    if subscription is None:
        raise HTTPError(SubscriptionErrorCode.NotFound)
    return SubscriptionDetailDTO.model_validate(subscription)


@http_service
async def update_subscription_service(
    guild_id: int, user_id: int, dto: UpdateSubscriptionDTO, session: AsyncSession
) -> SubscriptionDTO:
    sub_repo = SubscriptionRepository(session)
    subscription = await sub_repo.get_by_guild_id(guild_id)
    if subscription is None:
        raise HTTPError(SubscriptionErrorCode.NotFound)

    values = {}

    if dto.billing_id is not None:
        billing_repo = BillingRepository(session)
        billing = await billing_repo.get_by_id(dto.billing_id)
        if billing is None or billing.user_id != user_id:
            raise HTTPError(BillingErrorCode.NotFound)
        values["billing_id"] = dto.billing_id

    if dto.tier is not None:
        values["tier"] = int(dto.tier)

    if values:
        await session.execute(
            update(Subscription)
            .where(Subscription.subscription_id == subscription.subscription_id)
            .values(**values)
        )
        for k, v in values.items():
            setattr(subscription, k, v)

    return SubscriptionDTO.model_validate(subscription)
