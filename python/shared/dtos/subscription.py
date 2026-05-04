from __future__ import annotations

from datetime import datetime
from enum import IntEnum
from typing import TYPE_CHECKING

from pydantic import model_validator

from ..utils.error import HTTPError, ValidationErrorCode
from . import BaseDTO, BigInt


if TYPE_CHECKING:
    from .billing import BillingDTO


class Tier(IntEnum):
    FREE = 0
    PLUS = 1
    PRO = 2


class SubscriptionDTO(BaseDTO):
    subscription_id: int
    guild_id: BigInt
    tier: Tier
    expires_at: datetime


class SubscriptionDetailDTO(SubscriptionDTO):
    billing: BillingDTO | None = None


class CreateSubscriptionDTO(BaseDTO):
    billing_id: int
    tier: Tier

    @model_validator(mode="after")
    def validate(self) -> CreateSubscriptionDTO:
        if self.tier == Tier.FREE:
            raise HTTPError(ValidationErrorCode.Invalid)
        return self


class UpdateSubscriptionBillingDTO(BaseDTO):
    billing_id: int
