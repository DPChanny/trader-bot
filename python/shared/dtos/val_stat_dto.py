from pydantic import BaseModel


class AgentDto(BaseModel):
    name: str
    icon_url: str
    games: int
    win_rate: float


class ValStatDto(BaseModel):
    tier: str
    rank: str
    top_agents: list[AgentDto]
