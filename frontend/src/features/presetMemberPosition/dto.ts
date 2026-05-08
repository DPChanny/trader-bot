import type { BaseEntityDTO } from "@utils/dto";
import type { PositionDTO } from "@features/position/dto";

export interface PresetMemberPositionDTO extends BaseEntityDTO {
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
