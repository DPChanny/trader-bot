from ..entities import Payment
from . import BaseRepository


class PaymentRepository(BaseRepository):
    async def create(
        self,
        subscription_id: int,
        order_id: str,
        payment_key: str,
        amount: int,
        tier: int,
    ) -> Payment:
        payment = Payment(
            subscription_id=subscription_id,
            order_id=order_id,
            payment_key=payment_key,
            amount=amount,
            tier=tier,
        )
        self.session.add(payment)
        await self.session.flush()
        return payment
