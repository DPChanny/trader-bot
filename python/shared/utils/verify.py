from enum import IntEnum
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.dtos.subscription import Plan
from shared.entities import Subscription
from shared.repositories.member_repository import MemberRepository
from shared.repositories.subscription_repository import SubscriptionRepository
from shared.utils.error import ForbiddenErrorCode, HTTPError, NotFoundErrorCode


class Quota(IntEnum):
    PRESET_COUNT = 0
    AUCTION_TTL = 1


_PLAN_QUOTAS: dict[Plan | None, dict[Quota, Any]] = {
    None: {Quota.PRESET_COUNT: 1, Quota.AUCTION_TTL: 600},
    Plan.PLUS: {Quota.PRESET_COUNT: 5, Quota.AUCTION_TTL: 1800},
    Plan.PRO: {Quota.PRESET_COUNT: None, Quota.AUCTION_TTL: 3600},
}


def _effective_plan(sub: Subscription | None) -> Plan | None:
    if sub is None or not sub.is_valid:
        return None
    return Plan(sub.plan)


async def verify_role(
    guild_id: int, user_id: int, db: AsyncSession, min_role: Role
) -> Role:
    member_repo = MemberRepository(db)
    member = await member_repo.get_by_user_id(user_id, guild_id)
    if member is None:
        raise HTTPError(ForbiddenErrorCode.MemberNotMember)
    if Role(member.role) < min_role:
        raise HTTPError(ForbiddenErrorCode.MemberInsufficientRole)
    return Role(member.role)


async def verify_plan(guild_id: int, min_plan: Plan, db: AsyncSession) -> Plan:
    sub_repo = SubscriptionRepository(db)
    sub = await sub_repo.get_by_guild_id(guild_id)
    plan = _effective_plan(sub)
    if plan is None:
        raise HTTPError(NotFoundErrorCode.Subscription)
    if plan < min_plan:
        raise HTTPError(ForbiddenErrorCode.SubscriptionInsufficientPlan)
    return plan


async def verify_quota(
    guild_id: int, quota: Quota, value: int, db: AsyncSession
) -> None:
    sub_repo = SubscriptionRepository(db)
    sub = await sub_repo.get_by_guild_id(guild_id)
    plan = _effective_plan(sub)
    limit = _PLAN_QUOTAS[plan][quota]
    if limit is not None and value > limit:
        raise HTTPError(ForbiddenErrorCode.SubscriptionInsufficientQuota)


async def get_quota(guild_id: int, quota: Quota, db: AsyncSession) -> Any:
    sub_repo = SubscriptionRepository(db)
    sub = await sub_repo.get_by_guild_id(guild_id)
    plan = _effective_plan(sub)
    return _PLAN_QUOTAS[plan][quota]
