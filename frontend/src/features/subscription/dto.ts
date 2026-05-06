export const Plan = {
  PLUS: 0,
  PRO: 1,
} as const;

export type Plan = (typeof Plan)[keyof typeof Plan];

export interface SubscriptionDTO {
  subscriptionId: number;
  guildId: string;
  billingId: number | null;
  plan: Plan;
  expiresAt: string;
}

export interface RegisterSubscriptionDTO {
  billingId: number;
  plan: Plan;
}
