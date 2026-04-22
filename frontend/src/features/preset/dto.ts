import { z } from "zod";
import { nameSchema } from "@utils/dto";
import type { PresetMemberDetailDTO } from "@features/presetMember/dto";

export const CreatePresetSchema = z.object({
  name: nameSchema,
  points: z.coerce.number().int().min(0).max(1000),
  timer: z.coerce.number().int().min(1).max(60),
  teamSize: z.coerce.number().int().min(1).max(10),
  pointScale: z.coerce.number().int().min(1).max(10),
});

export const UpdatePresetSchema = CreatePresetSchema.partial();

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
