import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.subscription import CreateSubscriptionDTO, SubscriptionDTO, Tier
from shared.entities import Payment
from shared.repositories.subscription_repository import SubscriptionRepository
from shared.utils.error import HTTPError, SubscriptionErrorCode
from shared.utils.service import http_service

from ..utils.toss import charge_billing_key, issue_billing_key


_TIER_AMOUNT = {Tier.PLUS: 10000, Tier.PRO: 20000}
_TIER_ORDER_NAME = {Tier.PLUS: "Trader Bot Plus", Tier.PRO: "Trader Bot Pro"}
_TIER_PERIOD = {Tier.PLUS: timedelta(days=30), Tier.PRO: timedelta(days=30)}


@http_service
async def create_subscription_service(
    guild_id: int, user_id: int, dto: CreateSubscriptionDTO, session: AsyncSession
) -> SubscriptionDTO:
    sub_repo = SubscriptionRepository(session)
    existing = await sub_repo.get_by_guild_id(guild_id)

    if existing is not None and existing.is_renewable:
        raise HTTPError(SubscriptionErrorCode.Duplicated)

    customer_key = str(user_id)
    billing_key = await issue_billing_key(dto.auth_key, customer_key)

    order_id = uuid.uuid4().hex
    amount = _TIER_AMOUNT[dto.tier]
    order_name = _TIER_ORDER_NAME[dto.tier]

    await charge_billing_key(billing_key, customer_key, order_id, amount, order_name)

    expires_at = datetime.now(UTC) + _TIER_PERIOD[dto.tier]
    subscription = await sub_repo.upsert(
        guild_id=guild_id,
        user_id=user_id,
        tier=int(dto.tier),
        billing_key=billing_key,
        expires_at=expires_at,
    )

    session.add(
        Payment(
            subscription_id=subscription.subscription_id,
            user_id=user_id,
            order_id=order_id,
            amount=amount,
            tier=int(dto.tier),
        )
    )

    return SubscriptionDTO.model_validate(subscription)
