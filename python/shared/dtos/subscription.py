from __future__ import annotations

from datetime import datetime
from enum import IntEnum
from typing import TYPE_CHECKING

from . import BaseDTO, BigInt


if TYPE_CHECKING:
    from .billing import BillingDTO


class Tier(IntEnum):
    PLUS = 0
    PRO = 1


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


class UpdateSubscriptionDTO(BaseDTO):
    billing_id: int | None = None
    tier: Tier | None = None
