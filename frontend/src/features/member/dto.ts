import { z } from "zod";
import { nullableNameSchema, nullableUrlSchema } from "@utils/dto";
import type { UserDetailDTO } from "@features/user/dto";

export enum Role {
  VIEWER = 0,
  EDITOR = 1,
  ADMIN = 2,
  OWNER = 3,
}

type RoleColor = "green" | "blue" | "red" | "gold";

export type RoleEntry = {
  key: Role;
  displayName: string;
  color: RoleColor;
};

const ROLE_ENTRIES: Record<Role, RoleEntry> = {
  [Role.VIEWER]: { key: Role.VIEWER, displayName: "열람자", color: "blue" },
  [Role.EDITOR]: { key: Role.EDITOR, displayName: "편집자", color: "green" },
  [Role.ADMIN]: { key: Role.ADMIN, displayName: "관리자", color: "red" },
  [Role.OWNER]: { key: Role.OWNER, displayName: "소유자", color: "gold" },
};

export function getRoleEntries(): Record<Role, RoleEntry> {
  return ROLE_ENTRIES;
}

export interface MemberDTO {
  memberId: number;
  guildId: string;
  userId: string;
  role: Role;
  name: string | null;
  alias: string | null;
  avatarHash: string | null;
  infoUrl: string | null;
}

export interface MemberDetailDTO extends MemberDTO {
  avatarUrl: string | null;
  user: UserDetailDTO;
}

export const UpdateMemberSchema = z.object({
  alias: nullableNameSchema.optional(),
  infoUrl: nullableUrlSchema.optional(),
  role: z.number().int().optional(),
});

export type UpdateMemberDTO = z.infer<typeof UpdateMemberSchema>;
