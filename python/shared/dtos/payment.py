from . import BaseDTO, BigInt
from .subscription import Tier


class PaymentDTO(BaseDTO):
    payment_id: int
    subscription_id: int | None
    user_id: BigInt | None
    order_id: str
    amount: int
    tier: Tier
