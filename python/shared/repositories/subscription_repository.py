from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from ..entities import Subscription
from . import BaseRepository


class SubscriptionRepository(BaseRepository):
    async def get_by_guild_id(self, guild_id: int) -> Subscription | None:
        result = await self.session.execute(
            select(Subscription).where(Subscription.guild_id == guild_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, subscription_id: int) -> Subscription | None:
        result = await self.session.execute(
            select(Subscription).where(Subscription.subscription_id == subscription_id)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self,
        guild_id: int,
        tier: int,
        status: int,
        billing_key: str,
        expires_at: datetime,
    ) -> Subscription:
        stmt = pg_insert(Subscription).values(
            guild_id=guild_id,
            tier=tier,
            status=status,
            billing_key=billing_key,
            expires_at=expires_at,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["guild_id"],
            set_={
                "tier": stmt.excluded.tier,
                "status": stmt.excluded.status,
                "billing_key": stmt.excluded.billing_key,
                "expires_at": stmt.excluded.expires_at,
            },
        ).returning(Subscription)
        result = await self.session.execute(stmt)
        return result.scalars().one()

    async def get_due_subscription_ids(self, buffer: timedelta) -> list[int]:
        cutoff = datetime.now(UTC) + buffer
        result = await self.session.execute(
            select(Subscription.subscription_id).where(
                Subscription.status == 0,  # ACTIVE
                Subscription.expires_at <= cutoff,
                Subscription.billing_key.is_not(None),
            )
        )
        return list(result.scalars().all())
