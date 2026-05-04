from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.billing import BillingDTO
from shared.dtos.member import Role
from shared.repositories.billing_repository import BillingRepository
from shared.repositories.subscription_repository import SubscriptionRepository
from shared.utils.error import HTTPError, SubscriptionErrorCode
from shared.utils.service import http_service

from ..utils.member import verify_role
from ..utils.toss import delete_billing_key, issue_billing_key


@http_service
async def register_billing_service(
    guild_id: int, user_id: int, auth_key: str, session: AsyncSession
) -> BillingDTO:
    sub_repo = SubscriptionRepository(session)
    subscription = await sub_repo.get_by_guild_id(guild_id)
    if subscription is None or subscription.expires_at <= datetime.now(UTC):
        raise HTTPError(SubscriptionErrorCode.NotFound)

    billing_repo = BillingRepository(session)
    existing_billing = await billing_repo.get_by_subscription_id(
        subscription.subscription_id
    )
    if existing_billing is not None:
        raise HTTPError(SubscriptionErrorCode.Duplicated)

    customer_key = str(user_id)
    billing_key = await issue_billing_key(auth_key, customer_key)

    billing = await billing_repo.upsert(
        subscription_id=subscription.subscription_id,
        user_id=user_id,
        billing_key=billing_key,
    )
    return BillingDTO.model_validate(billing)


@http_service
async def delete_billing_service(
    guild_id: int, user_id: int, session: AsyncSession
) -> None:
    await verify_role(guild_id, user_id, session, Role.ADMIN)

    sub_repo = SubscriptionRepository(session)
    subscription = await sub_repo.get_by_guild_id(guild_id)
    if subscription is None:
        raise HTTPError(SubscriptionErrorCode.NotFound)

    billing_repo = BillingRepository(session)
    billing = await billing_repo.get_by_subscription_id(subscription.subscription_id)
    if billing is None:
        raise HTTPError(SubscriptionErrorCode.NotFound)

    await delete_billing_key(billing.billing_key)
    await session.delete(billing)
