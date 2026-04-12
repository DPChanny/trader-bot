import { z } from "zod";
import { nameSchema, nullableUrlSchema } from "@/utils/dto";

export const AddTierSchema = z.object({
  name: nameSchema,
  iconUrl: nullableUrlSchema,
});

export const UpdateTierSchema = z.object({
  name: nameSchema.optional(),
  iconUrl: nullableUrlSchema.optional(),
});

export type AddTierDTO = z.infer<typeof AddTierSchema>;
export type UpdateTierDTO = z.infer<typeof UpdateTierSchema>;

export interface TierDTO {
  tierId: number;
  presetId: number;
  name: string;
  iconUrl: string | null;
}
