from . import BaseDTO, BigInt


class BillingDTO(BaseDTO):
    billing_id: int
    subscription_id: int
    user_id: BigInt
