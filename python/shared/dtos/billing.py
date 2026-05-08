from . import BaseDTO, BaseEntityDTO, BigInt


class BillingDTO(BaseEntityDTO):
    billing_id: int
    user_id: BigInt
    name: str


class RegisterBillingDTO(BaseDTO):
    auth_key: str
