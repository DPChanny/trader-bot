from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from ..entities import Billing
from . import BaseRepository


class BillingRepository(BaseRepository):
    async def get_by_subscription_id(self, subscription_id: int) -> Billing | None:
        result = await self.session.execute(
            select(Billing).where(Billing.subscription_id == subscription_id)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self, subscription_id: int, user_id: int, billing_key: str
    ) -> Billing:
        stmt = pg_insert(Billing).values(
            subscription_id=subscription_id, user_id=user_id, billing_key=billing_key
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["subscription_id"],
            set_={
                "user_id": stmt.excluded.user_id,
                "billing_key": stmt.excluded.billing_key,
            },
        ).returning(Billing)
        result = await self.session.execute(stmt)
        return result.scalars().one()
