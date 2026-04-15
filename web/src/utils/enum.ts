import { Status } from "@dtos/auction";
import { Role } from "@dtos/member";

type EnumEntry<TValue extends number> = {
  value: TValue;
  displayName: string;
};

const ROLE_DISPLAY_NAME: Record<Role, string> = {
  [Role.VIEWER]: "Viewer",
  [Role.EDITOR]: "Editor",
  [Role.ADMIN]: "Admin",
  [Role.OWNER]: "Owner",
};

const ROLE_ENTRIES: Array<EnumEntry<Role>> = [
  {
    value: Role.VIEWER,
    displayName: ROLE_DISPLAY_NAME[Role.VIEWER],
  },
  {
    value: Role.EDITOR,
    displayName: ROLE_DISPLAY_NAME[Role.EDITOR],
  },
  {
    value: Role.ADMIN,
    displayName: ROLE_DISPLAY_NAME[Role.ADMIN],
  },
  {
    value: Role.OWNER,
    displayName: ROLE_DISPLAY_NAME[Role.OWNER],
  },
];

const STATUS_DISPLAY_NAME: Record<Status, string> = {
  [Status.WAITING]: "Waiting",
  [Status.RUNNING]: "Running",
  [Status.COMPLETED]: "Completed",
};

const STATUS_ENTRIES: Array<EnumEntry<Status>> = [
  {
    value: Status.WAITING,
    displayName: STATUS_DISPLAY_NAME[Status.WAITING],
  },
  {
    value: Status.RUNNING,
    displayName: STATUS_DISPLAY_NAME[Status.RUNNING],
  },
  {
    value: Status.COMPLETED,
    displayName: STATUS_DISPLAY_NAME[Status.COMPLETED],
  },
];

export function getRoleEntries(): Array<EnumEntry<Role>> {
  return ROLE_ENTRIES;
}

export function getStatusEntries(): Array<EnumEntry<Status>> {
  return STATUS_ENTRIES;
}

export function getRoleDisplayNames(): Record<Role, string> {
  return ROLE_DISPLAY_NAME;
}

export function getStatusDisplayNames(): Record<Status, string> {
  return STATUS_DISPLAY_NAME;
}
