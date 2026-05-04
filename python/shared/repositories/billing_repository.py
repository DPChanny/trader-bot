from sqlalchemy import select

from ..entities import Billing
from . import BaseRepository


class BillingRepository(BaseRepository):
    async def get_by_id(self, billing_id: int) -> Billing | None:
        result = await self.session.execute(
            select(Billing).where(Billing.billing_id == billing_id)
        )
        return result.scalar_one_or_none()

    async def get_all_by_user_id(self, user_id: int) -> list[Billing]:
        result = await self.session.execute(
            select(Billing).where(Billing.user_id == user_id)
        )
        return list(result.scalars().all())
