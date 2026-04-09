import type { PresetMemberDetailDTO } from "./presetMemberDto";
import type { TierDTO } from "./tierDto";
import type { PositionDTO } from "./positionDto";

export enum Statistics {
  NONE = 0,
  LOL = 1,
  VAL = 2,
}
export const StatisticsDisplay: { [key in Statistics]: string } = {
  [Statistics.NONE]: "",
  [Statistics.LOL]: "League of Legends",
  [Statistics.VAL]: "VALORANT",
};

export interface PresetDTO {
  presetId: number;
  guildId: string;
  name: string;
  points: number;
  time: number;
  pointScale: number;
  statistics: Statistics;
}

export interface PresetDetailDTO extends PresetDTO {
  presetMembers: PresetMemberDetailDTO[];
  tiers: TierDTO[];
  positions: PositionDTO[];
}

export interface AddPresetDTO {
  name: string;
  points: number;
  time: number;
  pointScale?: number;
  statistics?: Statistics;
}

export interface UpdatePresetDTO {
  name?: string;
  points?: number;
  time?: number;
  pointScale?: number;
  statistics?: Statistics;
}
