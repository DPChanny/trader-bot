from __future__ import annotations

from datetime import datetime
from enum import IntEnum

from . import BaseDTO, BaseEntityDTO, BigInt


class Plan(IntEnum):
    PLUS = 0
    PRO = 1


class SubscriptionDTO(BaseEntityDTO):
    subscription_id: int
    guild_id: BigInt
    billing_id: int | None
    plan: Plan
    next_plan: Plan | None
    expires_at: datetime


class RegisterSubscriptionDTO(BaseDTO):
    billing_id: int
    plan: Plan


class UpdateSubscriptionDTO(BaseDTO):
    billing_id: int | None = None
    next_plan: Plan | None = None
