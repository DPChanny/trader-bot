from pydantic import BaseModel


class ChampionDto(BaseModel):
    name: str
    icon_url: str
    games: int
    win_rate: float


class LolStatDto(BaseModel):
    tier: str
    rank: str
    lp: int
    top_champions: list[ChampionDto]
