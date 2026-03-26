from . import BaseDto


class AgentDto(BaseDto):
    name: str
    icon_url: str
    games: int
    win_rate: float


class ValStatDto(BaseDto):
    tier: str
    rank: str
    top_agents: list[AgentDto]
