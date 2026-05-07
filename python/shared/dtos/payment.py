from . import BaseDTO, BigInt
from .subscription import Plan


class PaymentDTO(BaseDTO):
    payment_id: int
    guild_id: BigInt | None
    user_id: BigInt
    order_id: str
    payment_key: str | None
    plan: Plan
    amount: int
