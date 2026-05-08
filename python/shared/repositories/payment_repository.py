from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..entities import Payment
from . import BaseRepository


class PaymentRepository(BaseRepository):
    async def get_all_by_guild_id(self, guild_id: int) -> list[Payment]:
        result = await self.session.execute(
            select(Payment)
            .where(Payment.guild_id == guild_id)
            .order_by(Payment.payment_id.desc())
        )
        return list(result.scalars().all())

    async def get_all_by_user_id(self, user_id: int) -> list[Payment]:
        result = await self.session.execute(
            select(Payment)
            .where(Payment.user_id == user_id)
            .options(selectinload(Payment.guild), selectinload(Payment.billing))
            .order_by(Payment.payment_id.desc())
        )
        return list(result.scalars().all())
