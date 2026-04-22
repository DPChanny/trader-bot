import { Role } from "@features/member/dto";

type RoleColor = "green" | "blue" | "red" | "gold";

export type RoleEntry = {
  key: Role;
  displayName: string;
  color: RoleColor;
};

const ROLE_ENTRIES: Record<Role, RoleEntry> = {
  [Role.VIEWER]: {
    key: Role.VIEWER,
    displayName: "열람자",
    color: "blue",
  },
  [Role.EDITOR]: {
    key: Role.EDITOR,
    displayName: "편집자",
    color: "green",
  },
  [Role.ADMIN]: {
    key: Role.ADMIN,
    displayName: "관리자",
    color: "red",
  },
  [Role.OWNER]: {
    key: Role.OWNER,
    displayName: "소유자",
    color: "gold",
  },
};

export function getRoleEntries(): Record<Role, RoleEntry> {
  return ROLE_ENTRIES;
}
