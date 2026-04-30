import { z } from "zod";
import { nameSchema } from "@utils/dto";
import type { PresetMemberDetailDTO } from "@features/presetMember/dto";

const BasePresetSchema = z.object({
  name: nameSchema,
  points: z.coerce.number().int().min(0).max(10000),
  timer: z.coerce.number().int().min(1).max(60),
  teamSize: z.coerce.number().int().min(1).max(10),
  pointScale: z.coerce.number().int().min(1).max(100),
});

export const CreatePresetSchema = BasePresetSchema.refine(
  (data) => data.points >= data.teamSize,
);

export const UpdatePresetSchema = BasePresetSchema.partial().refine((data) => {
  if (data.points !== undefined && data.teamSize !== undefined) {
    return data.points >= data.teamSize;
  }
  return true;
});

export type CreatePresetDTO = z.infer<typeof CreatePresetSchema>;
export type UpdatePresetDTO = z.infer<typeof UpdatePresetSchema>;

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
}
