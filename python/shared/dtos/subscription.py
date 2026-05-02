from datetime import datetime
from enum import IntEnum

from . import BaseDTO, BigInt


class Tier(IntEnum):
    PLUS = 1
    PRO = 2


class SubscriptionStatus(IntEnum):
    ACTIVE = 0
    CANCELLED = 1
    EXPIRED = 2


class SubscriptionDTO(BaseDTO):
    subscription_id: int
    guild_id: BigInt
    tier: Tier
    status: SubscriptionStatus
    expires_at: datetime | None


class IssueBillingKeyDTO(BaseDTO):
    auth_key: str
    tier: Tier
