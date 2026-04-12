import { z } from "zod";
import { nullableNameSchema, nullableUrlSchema } from "@/utils/dto";
import type { UserDTO } from "./userDto";

export enum Role {
  VIEWER = 0,
  EDITOR = 1,
  ADMIN = 2,
  OWNER = 3,
}

export interface MemberDTO {
  memberId: number;
  guildId: string;
  userId: string;
  role: number;
  name: string | null;
  alias: string | null;
  avatarHash: string | null;
  avatarUrl: string | null;
  infoUrl: string | null;
}

export interface MemberDetailDTO extends MemberDTO {
  user: UserDTO;
}

export const UpdateMemberSchema = z.object({
  alias: nullableNameSchema.optional(),
  infoUrl: nullableUrlSchema.optional(),
  role: z.number().int().optional(),
});

export type UpdateMemberDTO = z.infer<typeof UpdateMemberSchema>;
