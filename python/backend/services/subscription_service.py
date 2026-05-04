import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.subscription import (
    CreateSubscriptionDTO,
    SubscriptionDetailDTO,
    SubscriptionDTO,
    Tier,
    UpdateSubscriptionBillingDTO,
)
from shared.entities import Payment
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
async def update_subscription_billing_service(
    guild_id: int,
    user_id: int,
    dto: UpdateSubscriptionBillingDTO,
    session: AsyncSession,
) -> SubscriptionDTO:
    sub_repo = SubscriptionRepository(session)
    subscription = await sub_repo.get_by_guild_id(guild_id)
    if subscription is None:
        raise HTTPError(SubscriptionErrorCode.NotFound)

    billing_repo = BillingRepository(session)
    billing = await billing_repo.get_by_id(dto.billing_id)
    if billing is None or billing.user_id != user_id:
        raise HTTPError(BillingErrorCode.NotFound)

    await sub_repo.update_billing(subscription.subscription_id, dto.billing_id)
    subscription.billing_id = dto.billing_id
    return SubscriptionDTO.model_validate(subscription)
