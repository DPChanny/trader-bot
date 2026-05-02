from . import BaseDTO
from .subscription import Tier


class PaymentDTO(BaseDTO):
    payment_id: int
    subscription_id: int
    order_id: str
    payment_key: str
    amount: int
    tier: Tier
