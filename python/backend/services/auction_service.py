import asyncio

from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from shared.dtos.auction_dto import (
    AuctionDTO,
    Team,
)
from shared.dtos.lol_stat_dto import ChampionDTO, LolStatDTO
from shared.dtos.preset_dto import PresetDetailDTO
from shared.dtos.val_stat_dto import AgentDTO, ValStatDTO
from shared.entities.auction import Auction as AuctionEntity
from shared.entities.lol_stat import Champion, LolStat
from shared.entities.member import Member, Role
from shared.entities.preset import Preset
from shared.entities.preset_member import PresetMember
from shared.entities.val_stat import Agent, ValStat
from shared.utils.database import get_async_session_factory
from shared.utils.discord import send_message
from shared.utils.env import get_app_origin

from ..auction.auction_manager import auction_manager
from ..utils.exception import service_exception_handler
from ..utils.role import verify_role
from ..utils.token import Payload


def _make_save_snapshot_callback(session_factory):
    async def callback(auction_id: int, state_snapshot: dict, status: int):
        async with session_factory() as db:
            await db.execute(
                update(AuctionEntity)
                .where(AuctionEntity.auction_id == auction_id)
                .values(state_snapshot=state_snapshot, status=status)
            )
            await db.commit()

    return callback


async def _query_preset_for_auction(preset_id: int, db: AsyncSession) -> Preset | None:
    result = await db.execute(
        select(Preset)
        .options(
            selectinload(Preset.preset_members)
            .joinedload(PresetMember.member)
            .joinedload(Member.discord_user),
            selectinload(Preset.preset_members)
            .joinedload(PresetMember.member)
            .joinedload(Member.guild),
            selectinload(Preset.preset_members).selectinload(
                PresetMember.preset_member_positions
            ),
            selectinload(Preset.preset_members)
            .joinedload(PresetMember.member)
            .selectinload(Member.lol_stat)
            .selectinload(LolStat.champions),
            selectinload(Preset.preset_members)
            .joinedload(PresetMember.member)
            .selectinload(Member.val_stat)
            .selectinload(ValStat.agents),
            selectinload(Preset.tiers),
            selectinload(Preset.positions),
        )
        .where(Preset.preset_id == preset_id)
    )
    return result.unique().scalar_one_or_none()


def _build_preset_snapshot(preset: Preset, preset_members: list[PresetMember]) -> dict:
    base = PresetDetailDTO.model_validate(preset).model_dump(mode="json")

    stats_by_member: dict[str, dict] = {}
    for pm in preset_members:
        member = pm.member
        if member is None:
            continue
        member_stats: dict = {}
        if member.lol_stat is not None:
            lol = member.lol_stat
            member_stats["lol_stat"] = LolStatDTO(
                tier=lol.tier,
                rank=lol.rank,
                lp=lol.lp,
                top_champions=[
                    ChampionDTO(
                        name=c.name,
                        icon_url=c.icon_url,
                        games=c.games,
                        win_rate=c.win_rate,
                    )
                    for c in sorted(lol.champions, key=lambda x: x.rank_order)
                ],
            ).model_dump(mode="json")
        if member.val_stat is not None:
            val = member.val_stat
            member_stats["val_stat"] = ValStatDTO(
                tier=val.tier,
                rank=val.rank,
                top_agents=[
                    AgentDTO(
                        name=a.name,
                        icon_url=a.icon_url,
                        games=a.games,
                        win_rate=a.win_rate,
                    )
                    for a in sorted(val.agents, key=lambda x: x.rank_order)
                ],
            ).model_dump(mode="json")
        if member_stats:
            stats_by_member[str(pm.member_id)] = member_stats

    base["stats_by_member"] = stats_by_member
    return base


@service_exception_handler
async def add_auction_service(
    preset_id: int, db: AsyncSession, payload: Payload
) -> AuctionDTO:
    preset = await _query_preset_for_auction(preset_id, db)

    if preset is None:
        raise HTTPException(
            status_code=404, detail="Auction create failed: preset not found"
        )

    await verify_role(preset.guild_id, payload.discord_id, db, Role.EDITOR)

    preset_members = preset.preset_members
    if not preset_members:
        raise HTTPException(status_code=400, detail="Auction create failed: no members")

    leaders = [pm for pm in preset_members if pm.is_leader]
    if not leaders:
        raise HTTPException(status_code=400, detail="Auction create failed: no leaders")

    if len(leaders) < 2:
        raise HTTPException(
            status_code=400,
            detail="Auction create failed: at least 2 leaders required",
        )

    teams = []
    leader_member_ids: set[int] = set()
    for idx, leader in enumerate(leaders):
        team = Team(
            team_id=idx + 1,
            leader_id=leader.member_id,
            member_id_list=[leader.member_id],
            points=preset.points,
        )
        teams.append(team)
        leader_member_ids.add(leader.member_id)

    member_ids = [pm.member_id for pm in preset_members]
    preset_snapshot = _build_preset_snapshot(preset, preset_members)

    # Persist to DB to get an auto-incremented auction_id
    db_auction = AuctionEntity(
        preset_id=preset_id,
        guild_id=preset.guild_id,
        preset_snapshot=preset_snapshot,
    )
    db.add(db_auction)
    await db.flush()
    auction_id: int = db_auction.auction_id
    await db.commit()

    session_factory = get_async_session_factory()
    save_callback = _make_save_snapshot_callback(session_factory)

    auction_manager.add_auction(
        auction_id=auction_id,
        preset_id=preset_id,
        guild_id=preset.guild_id,
        teams=teams,
        member_ids=member_ids,
        leader_member_ids=leader_member_ids,
        preset_snapshot=preset_snapshot,
        timer_duration=preset.time,
        save_snapshot_callback=save_callback,
    )

    logger.info(
        f"Auction created: auction_id={auction_id}, member_count={len(member_ids)}"
    )

    app_origin = get_app_origin()
    member_map = {pm.member_id: pm for pm in preset_members}

    async def _send_dm(pm: PresetMember):
        member = pm.member
        if member is None:
            return
        role_label = "팀장" if pm.is_leader else "선수"
        auction_url = f"{app_origin}/auction/{auction_id}"
        embed = [
            {
                "title": "Trader 경매",
                "fields": [
                    {
                        "name": "역할",
                        "value": role_label,
                        "inline": True,
                    },
                    {
                        "name": "참가 링크",
                        "value": auction_url,
                        "inline": False,
                    },
                ],
            }
        ]
        await send_message(member.discord_user_id, embed)

    await asyncio.gather(
        *[_send_dm(pm) for pm in preset_members],
        return_exceptions=True,
    )

    return AuctionDTO(
        auction_id=auction_id,
        preset_id=preset_id,
    )
