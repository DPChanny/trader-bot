from typing import List

from pydantic import BaseModel

from .base_dto import BaseResponseDTO


class AgentDto(BaseModel):
    name: str
    icon_url: str
    games: int
    win_rate: float


class ValStatDto(BaseModel):
    tier: str
    rank: str
    top_agents: List[AgentDto]


class GetValResponseDTO(BaseResponseDTO[ValStatDto]):
    pass
