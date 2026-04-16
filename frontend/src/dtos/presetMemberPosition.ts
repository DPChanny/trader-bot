import type { PositionDTO } from "./position";

export interface PresetMemberPositionDTO {
  presetMemberPositionId: number;
  presetMemberId: number;
  positionId: number;
}

export interface PresetMemberPositionDetailDTO extends PresetMemberPositionDTO {
  position: PositionDTO;
}

export interface AddPresetMemberPositionDTO {
  positionId: number;
}
