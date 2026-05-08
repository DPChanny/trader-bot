import { z } from "zod";
import { nameSchema, nullableUrlSchema } from "@utils/dto";
import type { BaseEntityDTO } from "@utils/dto";

export const AddTierSchema = z.object({
  name: nameSchema,
  iconUrl: nullableUrlSchema,
});

export const UpdateTierSchema = AddTierSchema.partial();

export type AddTierDTO = z.infer<typeof AddTierSchema>;
export type UpdateTierDTO = z.infer<typeof UpdateTierSchema>;

export interface TierDTO extends BaseEntityDTO {
  tierId: number;
  presetId: number;
  name: string;
  iconUrl: string | null;
}
