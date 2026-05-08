from . import BaseDTO, BaseEntityDTO, BigInt
from .billing import BillingDTO
from .guild import GuildDTO
from .subscription import Plan


class PaymentDTO(BaseEntityDTO):
    payment_id: int
    guild_id: BigInt | None
    user_id: BigInt
    billing_id: int | None
    order_id: str
    payment_key: str | None
    plan: Plan
    amount: int


class PaymentDetailDTO(PaymentDTO):
    guild: GuildDTO | None
    billing: BillingDTO | None
