import type { MemberDetailDTO } from "./member";
import type { PresetMemberPositionDetailDTO } from "./presetMemberPosition";
import type { TierDTO } from "./tier";

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
