export const Tier = {
  PLUS: 0,
  PRO: 1,
} as const;

export type Tier = (typeof Tier)[keyof typeof Tier];

export interface SubscriptionDTO {
  subscriptionId: number;
  guildId: string;
  billingId: number | null;
  tier: Tier;
  expiresAt: string;
}

export interface RegisterSubscriptionDTO {
  billingId: number;
  tier: Tier;
}
