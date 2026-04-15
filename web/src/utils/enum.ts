import { Status } from "@dtos/auction";
import { Role } from "@dtos/member";

type EnumEntry<TKey extends number> = {
  key: TKey;
  displayName: string;
};

type RoleColor = "green" | "blue" | "red" | "gold";

type RoleEntry = EnumEntry<Role> & {
  color: RoleColor;
};

const ROLE_ENTRIES: Record<Role, RoleEntry> = {
  [Role.VIEWER]: {
    key: Role.VIEWER,
    displayName: "Viewer",
    color: "blue",
  },
  [Role.EDITOR]: {
    key: Role.EDITOR,
    displayName: "Editor",
    color: "green",
  },
  [Role.ADMIN]: {
    key: Role.ADMIN,
    displayName: "Admin",
    color: "red",
  },
  [Role.OWNER]: {
    key: Role.OWNER,
    displayName: "Owner",
    color: "gold",
  },
};

const STATUS_ENTRIES: Record<Status, EnumEntry<Status>> = {
  [Status.WAITING]: {
    key: Status.WAITING,
    displayName: "대기중",
  },
  [Status.RUNNING]: {
    key: Status.RUNNING,
    displayName: "진행중",
  },
  [Status.COMPLETED]: {
    key: Status.COMPLETED,
    displayName: "완료",
  },
};

export function getRoleEntries(): Record<Role, RoleEntry> {
  return ROLE_ENTRIES;
}

export function getStatusEntries(): Record<Status, EnumEntry<Status>> {
  return STATUS_ENTRIES;
}
