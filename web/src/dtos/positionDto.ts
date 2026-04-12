import { z } from "zod";
import { nameSchema, nullableUrlSchema } from "@/utils/dto";

export const AddPositionSchema = z.object({
  name: nameSchema,
  iconUrl: nullableUrlSchema,
});

export const UpdatePositionSchema = z.object({
  name: nameSchema.optional(),
  iconUrl: nullableUrlSchema.optional(),
});

export type AddPositionDTO = z.infer<typeof AddPositionSchema>;
export type UpdatePositionDTO = z.infer<typeof UpdatePositionSchema>;

export interface PositionDTO {
  positionId: number;
  presetId: number;
  name: string;
  iconUrl: string | null;
}
