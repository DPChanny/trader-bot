import type { MemberDetailDTO } from "./memberDto";
import type { PresetMemberPositionDetailDTO } from "./presetMemberPositionDto";
import type { TierDTO } from "./tierDto";

export interface PresetMemberDTO {
  presetMemberId: number;
  presetId: number;
  memberId: number;
  tierId: number | null;
  isLeader: boolean;
}

export interface PresetMemberDetailDTO extends PresetMemberDTO {
  member: MemberDetailDTO;
  tier: TierDTO | null;
  presetMemberPositions: PresetMemberPositionDetailDTO[];
}

export interface AddPresetMemberDTO {
  memberId: number;
  tierId: number | null;
  isLeader: boolean;
}

export interface UpdatePresetMemberDTO {
  tierId?: number | null;
  isLeader?: boolean;
}
