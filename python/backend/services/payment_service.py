from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.dtos.payment import PaymentDTO
from shared.repositories.payment_repository import PaymentRepository
from shared.repositories.subscription_repository import SubscriptionRepository
from shared.utils.error import HTTPError, SubscriptionErrorCode
from shared.utils.service import http_service

from ..utils.member import verify_role


@http_service
async def get_my_payments_service(
    user_id: int, session: AsyncSession
) -> list[PaymentDTO]:
    payment_repo = PaymentRepository(session)
    payments = await payment_repo.get_all_by_user_id(user_id)
    return [PaymentDTO.model_validate(p) for p in payments]


@http_service
async def get_guild_payments_service(
    guild_id: int, user_id: int, session: AsyncSession
) -> list[PaymentDTO]:
    await verify_role(guild_id, user_id, session, Role.ADMIN)

    sub_repo = SubscriptionRepository(session)
    subscription = await sub_repo.get_by_guild_id(guild_id)
    if subscription is None:
        raise HTTPError(SubscriptionErrorCode.NotFound)

    payment_repo = PaymentRepository(session)
    payments = await payment_repo.get_all_by_subscription_id(
        subscription.subscription_id
    )
    return [PaymentDTO.model_validate(p) for p in payments]
