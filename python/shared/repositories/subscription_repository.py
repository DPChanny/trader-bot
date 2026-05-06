from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import joinedload

from ..entities import Billing, Subscription
from . import BaseRepository


class SubscriptionRepository(BaseRepository):
    async def get_by_guild_id(self, guild_id: int) -> Subscription | None:
        result = await self.session.execute(
            select(Subscription).where(Subscription.guild_id == guild_id)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self, guild_id: int, billing_id: int, tier: int, expires_at: datetime
    ) -> Subscription:
        stmt = pg_insert(Subscription).values(
            guild_id=guild_id, billing_id=billing_id, tier=tier, expires_at=expires_at
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["guild_id"],
            set_={
                "billing_id": stmt.excluded.billing_id,
                "tier": stmt.excluded.tier,
                "expires_at": stmt.excluded.expires_at,
            },
        ).returning(Subscription)
        result = await self.session.execute(stmt)
        return result.scalars().one()

    async def get_renewables(self, buffer: timedelta) -> list[Subscription]:
        cutoff = datetime.now(UTC) + buffer
        result = await self.session.execute(
            select(Subscription)
            .join(Billing, Billing.billing_id == Subscription.billing_id)
            .where(Subscription.expires_at <= cutoff)
            .options(joinedload(Subscription.billing))
        )
        return list(result.scalars().all())
