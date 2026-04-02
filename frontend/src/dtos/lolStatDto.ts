export interface ChampionDTO {
  name: string;
  iconUrl: string;
  games: number;
  winRate: number;
}

export interface LolStatDTO {
  tier: string;
  rank: string;
  lp: number;
  topChampions: ChampionDTO[];
}
