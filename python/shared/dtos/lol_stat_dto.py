from . import BaseDto


class ChampionDto(BaseDto):
    name: str
    icon_url: str
    games: int
    win_rate: float


class LolStatDto(BaseDto):
    tier: str
    rank: str
    lp: int
    top_champions: list[ChampionDto]
