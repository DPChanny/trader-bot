import { Status } from "@features/auction/dto";

export type StatusEntry = {
  key: Status;
  displayName: string;
};

const STATUS_ENTRIES: Record<Status, StatusEntry> = {
  [Status.WAITING]: {
    key: Status.WAITING,
    displayName: "대기중",
  },
  [Status.PENDING]: {
    key: Status.PENDING,
    displayName: "준비중",
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

export function getStatusEntries(): Record<Status, StatusEntry> {
  return STATUS_ENTRIES;
}
