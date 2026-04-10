import type { PositionDTO } from "./positionDto";

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
