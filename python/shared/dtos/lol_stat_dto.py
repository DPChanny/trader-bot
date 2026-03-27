from . import BaseDTO


class ChampionDTO(BaseDTO):
    name: str
    icon_url: str
    games: int
    win_rate: float


class LolStatDTO(BaseDTO):
    tier: str
    rank: str
    lp: int
    top_champions: list[ChampionDTO]
