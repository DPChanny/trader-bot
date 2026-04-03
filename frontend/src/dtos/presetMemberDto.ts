import type { MemberDTO } from "./memberDto";
import type { TierDTO } from "./tierDto";
import type { PresetMemberPositionDetailDTO } from "./presetMemberPositionDto";

export interface PresetMemberDTO {
  presetMemberId: number;
  presetId: number;
  memberId: number;
  tierId: number | null;
  isLeader: boolean;
}

export interface PresetMemberDetailDTO extends PresetMemberDTO {
  member: MemberDTO | null;
  tier: TierDTO | null;
  presetMemberPositions: PresetMemberPositionDetailDTO[];
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
