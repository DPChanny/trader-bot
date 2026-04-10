from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.preset_member_position_dto import (
    AddPresetMemberPositionDTO,
    PresetMemberPositionDTO,
)
from shared.utils.database import get_db

from ..services.preset_member_position_service import (
    add_preset_member_position_service,
    delete_preset_member_position_service,
)
from ..utils.token import Payload, verify_token


preset_member_position_router = APIRouter(
    prefix="/guild/{guild_id}/preset/{preset_id}/member/{preset_member_id}/position",
    tags=["preset_member_position"],
)


@preset_member_position_router.post("", response_model=PresetMemberPositionDTO)
async def add_preset_member_position_route(
    guild_id: int,
    preset_id: int,
    preset_member_id: int,
    dto: AddPresetMemberPositionDTO,
    db: AsyncSession = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return await add_preset_member_position_service(
        guild_id, preset_id, preset_member_id, dto, db, payload
    )


@preset_member_position_router.delete("/{preset_member_position_id}", status_code=204)
async def delete_preset_member_position_route(
    guild_id: int,
    preset_member_id: int,
    preset_member_position_id: int,
    db: AsyncSession = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return await delete_preset_member_position_service(
        guild_id, preset_member_id, preset_member_position_id, db, payload
    )
