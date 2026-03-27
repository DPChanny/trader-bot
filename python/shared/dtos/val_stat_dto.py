from . import BaseDTO


class AgentDTO(BaseDTO):
    name: str
    icon_url: str
    games: int
    win_rate: float


class ValStatDTO(BaseDTO):
    tier: str
    rank: str
    top_agents: list[AgentDTO]
