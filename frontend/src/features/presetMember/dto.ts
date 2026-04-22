import { z } from "zod";
import { nullableUrlSchema } from "@utils/dto";
import type { MemberDetailDTO } from "@features/member/dto";
import type { PresetMemberPositionDetailDTO } from "@features/presetMemberPosition/dto";
import type { TierDTO } from "@features/tier/dto";

export interface PresetMemberDTO {
  presetMemberId: number;
  presetId: number;
  memberId: number;
  tierId: number | null;
  isLeader: boolean;
  infoUrl: string | null;
}

export interface PresetMemberDetailDTO extends PresetMemberDTO {
  member: MemberDetailDTO;
  tier: TierDTO | null;
  presetMemberPositions: PresetMemberPositionDetailDTO[];
}

export const AddPresetMemberSchema = z.object({
  infoUrl: nullableUrlSchema,
});

export type AddPresetMemberDTO = z.infer<typeof AddPresetMemberSchema> & {
  memberId: number;
  tierId: number | null;
  isLeader: boolean;
};

export const UpdatePresetMemberSchema = AddPresetMemberSchema.partial();

export type UpdatePresetMemberDTO = z.infer<typeof UpdatePresetMemberSchema> & {
  tierId?: number | null;
  isLeader?: boolean;
};
