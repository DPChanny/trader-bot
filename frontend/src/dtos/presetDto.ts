import type { PresetMemberDetailDTO } from "./presetMemberDto";
import type { TierDTO } from "./tierDto";
import type { PositionDTO } from "./positionDto";

export interface PresetDTO {
  presetId: number;
  guildId: string;
  name: string;
  points: number;
  timer: number;
  teamSize: number;
  pointScale: number;
}

export interface PresetDetailDTO extends PresetDTO {
  presetMembers: PresetMemberDetailDTO[];
  tiers: TierDTO[];
  positions: PositionDTO[];
}

export interface AddPresetDTO {
  name: string;
  points: number;
  timer: number;
  teamSize: number;
  pointScale?: number;
}

export interface UpdatePresetDTO {
  name?: string;
  points?: number;
  timer?: number;
  teamSize?: number;
  pointScale?: number;
}
