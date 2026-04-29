from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild import GuildDTO
from shared.repositories.guild_repository import GuildRepository
from shared.utils.error import AppError, GuildErrorCode
from shared.utils.service import Event, bot_service


@bot_service
async def set_invite_channel_service(
    guild_id: int, channel_id: int | None, session: AsyncSession, event: Event
) -> None:
    repo = GuildRepository(session)
    entity = await repo.update_invite_channel(guild_id, channel_id)
    if entity is None:
        raise AppError(GuildErrorCode.NotFound)
    event.result = GuildDTO.model_validate(entity)
