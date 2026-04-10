import type { MemberDetailDTO } from "./memberDto";
import type { PresetMemberPositionDTO } from "./presetMemberPositionDto";

export interface PresetMemberDTO {
  presetMemberId: number;
  presetId: number;
  memberId: number;
  tierId: number | null;
  isLeader: boolean;
}

export interface PresetMemberDetailDTO extends PresetMemberDTO {
  member: MemberDetailDTO | null;
  presetMemberPositions: PresetMemberPositionDTO[];
}

export interface AddPresetMemberDTO {
  memberId: number;
  tierId?: number | null;
  isLeader?: boolean;
}

export interface UpdatePresetMemberDTO {
  tierId?: number | null;
  isLeader?: boolean;
}
