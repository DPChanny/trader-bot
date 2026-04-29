import asyncio
from dataclasses import dataclass, field

from discord import Guild as DiscordGuild
from discord.ext import commands
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild import GuildDTO
from shared.dtos.member import Role
from shared.entities import Member
from shared.repositories.guild_repository import GuildRepository
from shared.repositories.member_repository import MemberRepository
from shared.repositories.user_repository import UserRepository
from shared.utils.db import get_session
from shared.utils.service import Event, bot_service

from ..utils.guild import delete_guild


_BATCH_SIZE = 100


@dataclass
class _Guild:
    guild_dict: dict
    user_dicts: list[dict] = field(default_factory=list)
    member_dicts: list[dict] = field(default_factory=list)
    active_user_ids: set[int] = field(default_factory=set)


async def _collect(guild: DiscordGuild, sem: asyncio.Semaphore) -> _Guild:
    async with sem:
        data = _Guild(
            guild_dict={
                "discord_id": guild.id,
                "name": guild.name,
                "icon_hash": guild.icon.key if guild.icon else None,
            }
        )
        async for member in guild.fetch_members():
            if member.bot:
                continue
            if member.id == guild.owner_id:
                role = Role.OWNER
            elif member.guild_permissions.administrator:
                role = Role.ADMIN
            else:
                role = Role.VIEWER
            data.user_dicts.append(
                {
                    "discord_id": member.id,
                    "name": member.global_name or member.name,
                    "avatar_hash": member.avatar.key if member.avatar else None,
                }
            )
            data.member_dicts.append(
                {
                    "guild_id": guild.id,
                    "user_id": member.id,
                    "name": member.nick,
                    "avatar_hash": member.guild_avatar.key
                    if member.guild_avatar
                    else None,
                    "role": role,
                }
            )
            data.active_user_ids.add(member.id)
        return data


@bot_service
async def on_ready_service(
    bot: commands.Bot, session: AsyncSession, event: Event
) -> None:
    synced_guild_ids: set[int] = set()
    synced_count = 0
    removed_member_count = 0
    failed_guild_ids: list[int] = []

    sem = asyncio.Semaphore(10)
    guilds = list(bot.guilds)

    for batch_start in range(0, len(guilds), _BATCH_SIZE):
        batch_guilds = guilds[batch_start : batch_start + _BATCH_SIZE]

        tasks = [_collect(g, sem) for g in batch_guilds]
        collect_results = await asyncio.gather(*tasks, return_exceptions=True)

        batch_data: list[_Guild] = []
        for guild, result in zip(batch_guilds, collect_results, strict=True):
            if isinstance(result, BaseException):
                failed_guild_ids.append(guild.id)
            else:
                batch_data.append(result)
                synced_guild_ids.add(result.guild_dict["discord_id"])

        if batch_data:
            async for db_session in get_session():
                await GuildRepository(db_session).bulk_upsert(
                    [d.guild_dict for d in batch_data]
                )
                await UserRepository(db_session).bulk_upsert(
                    [u for d in batch_data for u in d.user_dicts]
                )
                await MemberRepository(db_session).bulk_upsert(
                    [m for d in batch_data for m in d.member_dicts]
                )
                for data in batch_data:
                    if data.active_user_ids:
                        stmt = delete(Member).where(
                            Member.guild_id == data.guild_dict["discord_id"],
                            Member.user_id.not_in(data.active_user_ids),
                        )
                        r = await db_session.execute(stmt)
                        removed_member_count += r.rowcount
                synced_count += sum(len(d.member_dicts) for d in batch_data)

    guild_repo = GuildRepository(session)
    guild_entities = await guild_repo.get_all()
    removed_guilds: list[GuildDTO] = []
    for guild_entity in guild_entities:
        if guild_entity.discord_id in synced_guild_ids:
            continue
        removed_guilds.append(await delete_guild(guild_entity.discord_id, session))

    event.detail |= {
        "synced_guild_count": synced_count,
        "removed_guild_count": len(removed_guilds),
        "removed_guilds": removed_guilds,
        "removed_member_count": removed_member_count,
        "failed_guild_count": len(failed_guild_ids),
        "failed_guild_ids": failed_guild_ids,
    }
