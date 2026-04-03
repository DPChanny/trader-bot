import type { PresetMemberDetailDTO } from "./presetMemberDto";
import type { TierDTO } from "./tierDto";
import type { PositionDTO } from "./positionDto";

export type Statistics = "NONE" | "LOL" | "VAL";
export const StatisticsDisplay: { [key in Statistics]: string } = {
  NONE: "",
  LOL: "LoL",
  VAL: "Valorant",
};

export interface PresetDTO {
  presetId: number;
  guildId: number;
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
