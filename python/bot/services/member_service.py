from discord import Member
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import MemberDTO
from shared.utils.service import Event, bot_service, set_event_response

from ..utils.member import delete_member, sync_member, sync_member_admin_role


@bot_service
async def on_member_join_service(
    member: Member,
    session: AsyncSession,
    event: Event,
) -> MemberDTO:
    response = await sync_member(member, session)
    return set_event_response(event, response)


@bot_service
async def on_member_update_service(
    before: Member,
    after: Member,
    session: AsyncSession,
    event: Event,
) -> MemberDTO:
    member_dto = await sync_member(after, session)
    if before.guild_permissions.administrator != after.guild_permissions.administrator:
        member_dto = await sync_member_admin_role(
            after.guild.id, after.id, after.guild_permissions.administrator, session
        )
    return set_event_response(event, member_dto)


@bot_service
async def on_member_remove_service(
    member: Member,
    session: AsyncSession,
    event: Event,
) -> MemberDTO:
    response = await delete_member(member.guild.id, member.id, session)
    return set_event_response(event, response)
