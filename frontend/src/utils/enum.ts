import { Status } from "@features/auction/dto";
import { Role } from "@features/member/dto";

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

