from . import BaseDTO, BigInt
from .subscription import Tier


class PaymentDTO(BaseDTO):
    payment_id: int
    subscription_id: int
    user_id: BigInt
    order_id: str
    amount: int
    tier: Tier
