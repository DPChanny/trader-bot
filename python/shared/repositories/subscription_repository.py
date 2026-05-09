from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from ..entities import Billing, Subscription
from . import BaseRepository


class SubscriptionRepository(BaseRepository):
    async def get_by_guild_id(self, guild_id: int) -> Subscription | None:
        result = await self.session.execute(
            select(Subscription).where(Subscription.guild_id == guild_id)
        )
        return result.scalar_one_or_none()

    async def get_renewables(self, buffer: timedelta) -> list[Subscription]:
        cutoff = datetime.now(UTC) + buffer
        result = await self.session.execute(
            select(Subscription)
            .join(Billing, Billing.billing_id == Subscription.billing_id)
            .where(Subscription.expires_at <= cutoff)
            .options(joinedload(Subscription.billing))
        )
        return list(result.scalars().all())
