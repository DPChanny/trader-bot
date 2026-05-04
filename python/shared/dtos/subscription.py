from __future__ import annotations

from datetime import datetime
from enum import IntEnum

from pydantic import model_validator

from ..utils.error import HTTPError, ValidationErrorCode
from . import BaseDTO, BigInt


class Tier(IntEnum):
    FREE = 0
    PLUS = 1
    PRO = 2


class BillingDTO(BaseDTO):
    billing_id: int
    subscription_id: int
    user_id: BigInt


class SubscriptionDTO(BaseDTO):
    subscription_id: int
    guild_id: BigInt
    tier: Tier
    expires_at: datetime


class SubscriptionDetailDTO(SubscriptionDTO):
    billing: BillingDTO | None = None


class CreateSubscriptionDTO(BaseDTO):
    auth_key: str
    tier: Tier

    @model_validator(mode="after")
    def validate(self) -> CreateSubscriptionDTO:
        if self.tier == Tier.FREE:
            raise HTTPError(ValidationErrorCode.Invalid)
        return self


class RegisterBillingDTO(BaseDTO):
    auth_key: str
