from . import BaseDTO, BigInt


class BillingDTO(BaseDTO):
    billing_id: int
    user_id: BigInt
    name: str


class RegisterBillingDTO(BaseDTO):
    auth_key: str
