from . import BaseDTO, BigInt
from .subscription import Tier


class PaymentDTO(BaseDTO):
    payment_id: int
    guild_id: BigInt | None
    user_id: BigInt
    order_id: str
    payment_key: str | None
    tier: Tier
