from __future__ import annotations

from datetime import datetime
from enum import IntEnum

from . import BaseDTO, BigInt


class Tier(IntEnum):
    PLUS = 0
    PRO = 1


class SubscriptionDTO(BaseDTO):
    subscription_id: int
    guild_id: BigInt
    tier: Tier
    expires_at: datetime


class RegisterSubscriptionDTO(BaseDTO):
    billing_id: int
    tier: Tier
