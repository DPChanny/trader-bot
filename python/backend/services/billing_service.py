from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.billing import BillingDTO
from shared.entities import Billing
from shared.repositories.billing_repository import BillingRepository
from shared.repositories.user_repository import UserRepository
from shared.utils.error import HTTPError, NotFoundErrorCode
from shared.utils.service import http_service

from ..utils.toss import delete_billing_key, issue_billing_key


@http_service
async def get_billings_service(user_id: int, session: AsyncSession) -> list[BillingDTO]:
    billing_repo = BillingRepository(session)
    billings = await billing_repo.get_all_by_user_id(user_id)
    return [BillingDTO.model_validate(b) for b in billings]


@http_service
async def register_billing_service(
    user_id: int, auth_key: str, session: AsyncSession
) -> BillingDTO:
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise HTTPError(NotFoundErrorCode.User)

    billing_key, name = await issue_billing_key(auth_key, user.customer_key)

    billing = Billing(user_id=user_id, billing_key=billing_key, name=name)
    session.add(billing)
    await session.flush()
    await session.refresh(billing)

    return BillingDTO.model_validate(billing)


@http_service
async def delete_billing_service(
    billing_id: int, user_id: int, session: AsyncSession
) -> None:
    billing_repo = BillingRepository(session)
    billing = await billing_repo.get_by_id(billing_id, user_id)
    if billing is None:
        raise HTTPError(NotFoundErrorCode.Billing)

    await delete_billing_key(billing.billing_key)
    await session.delete(billing)
