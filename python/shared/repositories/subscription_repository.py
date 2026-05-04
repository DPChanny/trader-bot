from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import selectinload

from ..entities import Billing, Subscription
from . import BaseRepository


class SubscriptionRepository(BaseRepository):
    async def get_by_guild_id(self, guild_id: int) -> Subscription | None:
        result = await self.session.execute(
            select(Subscription).where(Subscription.guild_id == guild_id)
        )
        return result.scalar_one_or_none()

    async def get_detail_by_guild_id(self, guild_id: int) -> Subscription | None:
        result = await self.session.execute(
            select(Subscription)
            .options(selectinload(Subscription.billing))
            .where(Subscription.guild_id == guild_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, subscription_id: int) -> Subscription | None:
        result = await self.session.execute(
            select(Subscription).where(Subscription.subscription_id == subscription_id)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self, guild_id: int, tier: int, expires_at: datetime
    ) -> Subscription:
        stmt = pg_insert(Subscription).values(
            guild_id=guild_id, tier=tier, expires_at=expires_at
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["guild_id"],
            set_={"tier": stmt.excluded.tier, "expires_at": stmt.excluded.expires_at},
        ).returning(Subscription)
        result = await self.session.execute(stmt)
        return result.scalars().one()

    async def get_renewables(self, buffer: timedelta) -> list[Subscription]:
        cutoff = datetime.now(UTC) + buffer
        result = await self.session.execute(
            select(Subscription)
            .join(Billing, Billing.subscription_id == Subscription.subscription_id)
            .where(Subscription.expires_at <= cutoff)
        )
        return list(result.scalars().all())

    async def update_renewal(self, subscription_id: int, expires_at: datetime) -> None:
        await self.session.execute(
            update(Subscription)
            .where(Subscription.subscription_id == subscription_id)
            .values(expires_at=expires_at)
        )
