export interface AgentDTO {
  name: string;
  iconUrl: string;
  games: number;
  winRate: number;
}

export interface ValStatDTO {
  tier: string;
  rank: string;
  topAgents: AgentDTO[];
}
