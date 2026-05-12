import { Plan } from "@features/subscription/dto";

export const PLAN_LABEL: Record<Plan, string> = {
  [Plan.PLUS]: "Trader Bot Plus",
  [Plan.PRO]: "Trader Bot Pro",
};

export const PLAN_COLOR: Record<Plan, "green" | "gold"> = {
  [Plan.PLUS]: "green",
  [Plan.PRO]: "gold",
};

export const PLAN_AMOUNT: Record<Plan, number> = {
  [Plan.PLUS]: 10_000,
  [Plan.PRO]: 20_000,
};

export const FREE_FEATURES = [
  "프리셋 1개",
  "프리셋 복사 · 구성",
  "경매 (10분 만료)",
];

export const PLAN_FEATURES: Record<Plan, string[]> = {
  [Plan.PLUS]: [
    "프리셋 5개",
    "프리셋 추가 · 수정",
    "경매 (30분 만료)",
    "Trader Bot 명령어",
  ],
  [Plan.PRO]: ["프리셋 무제한", "경매 (60분 만료)", "추후 추가 기능"],
};
